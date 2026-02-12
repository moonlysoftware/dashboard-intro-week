<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TogglTimeTrackingService
{
    private string $baseUrl = 'https://api.track.toggl.com';

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

        $cacheKey = "toggl_week_report_{$workspaceId}_{$startOfWeek}_{$endOfWeek}";

        try {
            return Cache::remember($cacheKey, 60, function () use ($workspaceId, $startOfWeek, $endOfWeek) {
                $users = $this->getUserTimeEntries($workspaceId, $startOfWeek, $endOfWeek);
                return $this->calculateWeekStats($users);
            });
        } catch (\Exception $e) {
            Log::error('Toggl API Error: ' . $e->getMessage());
            return $this->getEmptyReport();
        }
    }

    /**
     * Get time entries for all users in the workspace.
     *
     * Fires two Toggl API calls in parallel via Http::pool():
     *   - workspace_users : list of all workspace members
     *   - reports         : Reports API v3 time entries for the current week
     *
     * Results are cached by the caller (getCurrentWeekReport) to avoid
     * hammering Toggl on every browser poll.
     *
     * @param int    $workspace
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Support\Collection
     */
    private function getUserTimeEntries($workspace, $startDate, $endDate): Collection
    {
        $apiToken = config('services.toggl.api_token');
        $base     = $this->baseUrl;

        // Fire both requests simultaneously
        $responses = Http::pool(fn (Pool $pool) => [
            $pool->as('workspace_users')
                ->withHeaders(['Content-Type' => 'application/json'])
                ->withBasicAuth($apiToken, 'api_token')
                ->get("{$base}/api/v9/workspaces/{$workspace}/workspace_users"),

            $pool->as('reports')
                ->withHeaders(['Content-Type' => 'application/json'])
                ->withBasicAuth($apiToken, 'api_token')
                ->post("{$base}/reports/api/v3/workspace/{$workspace}/search/time_entries", [
                    'start_date' => $startDate,
                    'end_date'   => $endDate,
                    'page_size'  => 1000,
                ]),
        ]);

        if (!$responses['workspace_users']->successful()) {
            $errorMsg = "Failed to fetch workspace users. Status: {$responses['workspace_users']->status()}, Body: {$responses['workspace_users']->body()}";
            Log::error('Toggl Users API Error:', ['error' => $errorMsg]);
            throw new \Exception($errorMsg);
        }

        $workspaceUsers = $responses['workspace_users']->json() ?? [];

        if (empty($workspaceUsers)) {
            throw new \Exception('Failed to fetch workspace users - empty response');
        }

        $users = collect($workspaceUsers)->map(function ($workspaceUser) {
            return [
                'id'    => (int) ($workspaceUser['uid'] ?? $workspaceUser['user_id'] ?? 0),
                'name'  => $workspaceUser['name'] ?? 'Unknown User',
                'email' => $workspaceUser['email'] ?? null,
            ];
        })->filter(fn($user) => $user['id'] !== 0);

        if ($users->isEmpty()) {
            throw new \Exception('No valid users found in workspace');
        }

        if (!$responses['reports']->successful()) {
            Log::warning('Toggl Reports API failed, falling back to empty entries', [
                'status' => $responses['reports']->status(),
            ]);
        }

        $timeEntries        = $responses['reports']->successful() ? ($responses['reports']->json() ?? []) : [];
        $groupedTimeEntries = collect($timeEntries)->groupBy('user_id');

        Log::info('Toggl fetch complete', [
            'users'          => $users->count(),
            'report_entries' => count($timeEntries),
        ]);

        return $users->map(function ($user) use ($groupedTimeEntries) {
            $userEntries = $groupedTimeEntries->get($user['id'], collect([]));

            $user['time_entries'] = $userEntries->flatMap(function ($entry) {
                $nested = $entry['time_entries'] ?? [];
                return collect($nested)->map(function ($timeEntry) use ($entry) {
                    return [
                        'seconds'     => $timeEntry['seconds'] ?? 0,
                        'start'       => $timeEntry['start'] ?? null,
                        'stop'        => $timeEntry['stop'] ?? null,
                        'billable'    => $entry['billable'] ?? false,
                        'project_id'  => $entry['project_id'] ?? null,
                        'task_id'     => $entry['task_id'] ?? null,
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

            $secondsMissed = $secondsClocked >= $secondsExpected
                ? 0
                : $secondsExpected - $secondsClocked;

            if ($secondsMissed > 0) {
                $usersIncomplete++;
                $usersWithMissingHours[] = [
                    'name'          => $user['name'],
                    'hours_missing' => $this->prettyTime($secondsMissed),
                    'hours_clocked' => $this->prettyTime($secondsClocked),
                    'percentage'    => round(($secondsClocked / $secondsExpected) * 100, 0),
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
            'week_number'        => Carbon::now()->weekOfYear,
            'year'               => Carbon::now()->year,
            'total_users'        => $totalUsers,
            'users_complete'     => $usersComplete,
            'users_incomplete'   => $usersIncomplete,
            'percentage_complete' => $percentageComplete,
            'missing_hours_users' => $usersWithMissingHours,
        ];
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
        $hours   = sprintf('%02d', floor($seconds / 3600));
        $minutes = sprintf('%02d', floor(($seconds / 60) % 60));
        $secs    = sprintf('%02d', $seconds % 60);

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
            'week_number'         => Carbon::now()->weekOfYear,
            'year'                => Carbon::now()->year,
            'total_users'         => 0,
            'users_complete'      => 0,
            'users_incomplete'    => 0,
            'percentage_complete' => 0,
            'missing_hours_users' => [],
        ];
    }
}
