<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TogglTimeTrackingService
{
    /**
     * Get the current week time tracking report
     *
     * @return array
     */
    public function getCurrentWeekReport(): array
    {
        $workspaceId = config('services.toggl.workspace');

        if (!$workspaceId) {
            return $this->getEmptyReport();
        }

        $startOfWeek = Carbon::now()->startOfWeek()->format('Y-m-d');
        $endOfWeek = Carbon::now()->endOfWeek()->format('Y-m-d');

        try {
            $users = $this->getUserTimeEntries($workspaceId, $startOfWeek, $endOfWeek);
            return $this->calculateWeekStats($users);
        } catch (\Exception $e) {
            Log::error('Toggl API Error: ' . $e->getMessage());
            return $this->getEmptyReport();
        }
    }

    /**
     * Get time entries for all users in the workspace
     *
     * @param int $workspace
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Support\Collection
     */
    private function getUserTimeEntries($workspace, $startDate, $endDate)
    {
        // Step 1: Get workspace users using Track API v9
        $usersResponse = Http::toggl()->get("/api/v9/workspaces/{$workspace}/workspace_users");

        if (!$usersResponse->successful()) {
            $errorMsg = "Failed to fetch workspace users. Status: {$usersResponse->status()}, Body: {$usersResponse->body()}";
            Log::error('Toggl Users API Error:', ['error' => $errorMsg]);
            throw new \Exception($errorMsg);
        }

        $workspaceUsers = $usersResponse->json();

        if ($workspaceUsers === null || empty($workspaceUsers)) {
            Log::warning('Toggl API returned null or empty users response');
            throw new \Exception('Failed to fetch workspace users - null response');
        }

        Log::info('Toggl Users Response:', [
            'count' => count($workspaceUsers),
            'sample' => array_slice($workspaceUsers, 0, 2)
        ]);

        // Extract user data from workspace_users structure
        $users = collect($workspaceUsers)->map(function ($workspaceUser) {
            return [
                'id' => $workspaceUser['uid'] ?? $workspaceUser['user_id'] ?? null,
                'name' => $workspaceUser['name'] ?? 'Unknown User',
                'email' => $workspaceUser['email'] ?? null,
            ];
        })->filter(fn($user) => $user['id'] !== null);

        if ($users->isEmpty()) {
            Log::warning('No valid users found in workspace');
            throw new \Exception('No valid users found in workspace');
        }

        $userIds = $users->pluck('id')->toArray();

        $timeEntriesResponse = Http::toggl()->post("/reports/api/v3/workspace/{$workspace}/search/time_entries", [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'user_ids' => $userIds,
            'page_size' => 1000,
        ]);

        if (!$timeEntriesResponse->successful()) {
            $errorMsg = "Failed to fetch time entries. Status: {$timeEntriesResponse->status()}, Body: {$timeEntriesResponse->body()}";
            Log::error('Toggl Time Entries API Error:', ['error' => $errorMsg]);
            throw new \Exception($errorMsg);
        }

        $timeEntries = $timeEntriesResponse->json();

        if ($timeEntries === null) {
            Log::warning('Toggl API returned null time entries response');
            $timeEntries = [];
        }

        Log::info('Toggl Time Entries Response:', [
            'count' => count($timeEntries),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'sample' => array_slice($timeEntries, 0, 2)
        ]);

        $groupedTimeEntries = collect($timeEntries)->groupBy('user_id');

        return $users->map(function ($user) use ($groupedTimeEntries) {
            $userEntries = $groupedTimeEntries->get($user['id'], collect([]));

            $user['time_entries'] = $userEntries->flatMap(function ($entry) {
                // Each entry can have multiple time_entries nested
                $timeEntriesNested = $entry['time_entries'] ?? [];
                return collect($timeEntriesNested)->map(function ($timeEntry) use ($entry) {
                    return [
                        'seconds' => $timeEntry['seconds'] ?? 0,
                        'start' => $timeEntry['start'] ?? null,
                        'stop' => $timeEntry['stop'] ?? null,
                        'billable' => $entry['billable'] ?? false,
                        'project_id' => $entry['project_id'] ?? null,
                        'task_id' => $entry['task_id'] ?? null,
                        'description' => $entry['description'] ?? null,
                    ];
                });
            })->values()->toArray();

            return $user;
        });
    }

    /**
     * Calculate weekly statistics for all users
     *
     * @param \Illuminate\Support\Collection $users
     * @return array
     */
    private function calculateWeekStats($users): array
    {
        $usersWithMissingHours = [];
        $totalUsers = 0;
        $usersComplete = 0;
        $usersIncomplete = 0;

        foreach ($users as $user) {
            $totalUsers++;

            $secondsExpected = $this->getWeeklyWorkSeconds();
            $collectedTimeEntries = collect($user['time_entries']);

            $secondsClocked = $collectedTimeEntries->sum('seconds');
            $secondsBreak = $this->getSecondsBreak($user['time_entries']);
            $secondsClockedWithoutBreak = $secondsClocked - $secondsBreak;

            $secondsMissed = $secondsClockedWithoutBreak >= $secondsExpected
                ? 0
                : $secondsExpected - $secondsClockedWithoutBreak;

            if ($secondsMissed > 0) {
                $usersIncomplete++;
                $usersWithMissingHours[] = [
                    'name' => $user['name'],
                    'hours_missing' => $this->prettyTime($secondsMissed),
                    'hours_clocked' => $this->prettyTime($secondsClockedWithoutBreak),
                    'percentage' => round(($secondsClockedWithoutBreak / $secondsExpected) * 100, 0),
                ];
            } else {
                $usersComplete++;
            }
        }

        usort($usersWithMissingHours, fn($a, $b) => $a['percentage'] <=> $b['percentage']);

        $percentageComplete = $totalUsers > 0
            ? round(($usersComplete / $totalUsers) * 100, 0)
            : 0;

        return [
            'week_number' => Carbon::now()->weekOfYear,
            'year' => Carbon::now()->year,
            'total_users' => $totalUsers,
            'users_complete' => $usersComplete,
            'users_incomplete' => $usersIncomplete,
            'percentage_complete' => $percentageComplete,
            'missing_hours_users' => $usersWithMissingHours,
        ];
    }

    /**
     * Get the total break seconds from time entries
     *
     * @param array $timeEntries
     * @return int
     */
    private function getSecondsBreak(array $timeEntries): int
    {
        return collect($timeEntries)->sum(function ($te) {
            $isBreak = isset($te['project_id']) && isset($te['task_id']);

            if (!$isBreak || !isset($te['seconds'])) {
                return 0;
            }

            $start = Carbon::parse($te['start']);
            $seconds = (int) $te['seconds'];

            // negeer lunch break op vrijdag tussen 11:00 en 13:00
            if ($start->isFriday()) {
                $windowStart = $start->copy()->setTime(11, 0, 0);
                $windowEnd = $start->copy()->setTime(13, 0, 0);
                $stop = $start->copy()->addSeconds($seconds);

                $overlapsWindow = $start->lt($windowEnd) && $stop->gt($windowStart);
                if ($overlapsWindow) {
                    return 0;
                }
            }

            return $seconds;
        });
    }

    /**
     * Get the expected weekly work seconds (default 37.5 hours)
     *
     * @return int
     */
    private function getWeeklyWorkSeconds(): int
    {
        // 37.5 hours per week (7.5 hours per day * 5 days)
        // Friday is 7 hours (0.5 hours lunch break)
        return 37 * 3600;
    }

    /**
     * Convert seconds to pretty time format (HH:MM:SS)
     *
     * @param int $seconds
     * @return string
     */
    private function prettyTime(int $seconds): string
    {
        $hours = sprintf('%02d', floor($seconds / 3600));
        $minutes = sprintf('%02d', floor(($seconds / 60) % 60));
        $secs = sprintf('%02d', $seconds % 60);

        return "{$hours}:{$minutes}:{$secs}";
    }

    /**
     * Get empty report structure when Toggl is not configured
     *
     * @return array
     */
    private function getEmptyReport(): array
    {
        return [
            'week_number' => Carbon::now()->weekOfYear,
            'year' => Carbon::now()->year,
            'total_users' => 0,
            'users_complete' => 0,
            'users_incomplete' => 0,
            'percentage_complete' => 0,
            'missing_hours_users' => [],
        ];
    }
}
