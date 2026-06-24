<?php

namespace App\Services;

use Carbon\Carbon;
use Google\Client;
use Google\Service\Calendar;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private const TIMEZONE = 'Europe/Amsterdam';

    private ?Calendar $calendarService = null;

    public static function isConfigured(): bool
    {
        if (config('services.google_calendar.credentials_json')) {
            return true;
        }

        $path = config('services.google_calendar.credentials');

        return $path && file_exists($path);
    }

    private function getCalendarService(): ?Calendar
    {
        if ($this->calendarService !== null) {
            return $this->calendarService;
        }

        try {
            $client = new Client();

            $credentialsJson = config('services.google_calendar.credentials_json');
            if ($credentialsJson) {
                $client->setAuthConfig(json_decode($credentialsJson, true));
            } else {
                $credentialsPath = config('services.google_calendar.credentials');

                if (! $credentialsPath || ! file_exists($credentialsPath)) {
                    Log::warning('Google Calendar: credentials file not found at ' . $credentialsPath);

                    return null;
                }

                $client->setAuthConfig($credentialsPath);
            }

            $client->setScopes([Calendar::CALENDAR_READONLY]);
            $this->calendarService = new Calendar($client);

            return $this->calendarService;
        } catch (\Exception $e) {
            Log::error('Google Calendar: failed to initialize client: ' . $e->getMessage());

            return null;
        }
    }

    /**
     * @return array{
     *   name: string,
     *   status: 'available'|'occupied'|'unknown',
     *   next_booking: string|null,
     *   available_at: string|null,
     *   current_duration_minutes: int|null,
     *   next_duration_minutes: int|null,
     *   error?: string
     * }
     */
    public function getRoomAvailability(string $calendarId, string $roomName): array
    {
        $service = $this->getCalendarService();

        if ($service === null) {
            return $this->unknownRoom($roomName, 'Google Calendar credentials niet gevonden');
        }

        try {
            $now = Carbon::now(self::TIMEZONE);
            $startOfDay = $now->copy()->startOfDay();
            $endOfDay = $now->copy()->endOfDay();

            $events = $service->events->listEvents($calendarId, [
                'timeMin'      => $startOfDay->toRfc3339String(),
                'timeMax'      => $endOfDay->toRfc3339String(),
                'singleEvents' => true,
                'orderBy'      => 'startTime',
                'maxResults'   => 25,
            ]);

            $parsedEvents = [];
            foreach ($events->getItems() as $event) {
                if ($event->getStatus() === 'cancelled') {
                    continue;
                }

                $startRaw = $event->getStart()->getDateTime();
                $endRaw = $event->getEnd()->getDateTime();

                // Skip all-day blocks — only timed bookings count for room occupancy
                if (! $startRaw || ! $endRaw) {
                    continue;
                }

                $parsedEvents[] = [
                    'start'   => Carbon::parse($startRaw, self::TIMEZONE),
                    'end'     => Carbon::parse($endRaw, self::TIMEZONE),
                    'summary' => $event->getSummary(),
                ];
            }

            $currentEvent = null;
            $nextEvent = null;

            foreach ($parsedEvents as $event) {
                if ($event['start']->lte($now) && $event['end']->gt($now)) {
                    $currentEvent = $event;
                } elseif ($event['start']->gt($now) && $nextEvent === null) {
                    $nextEvent = $event;
                }
            }

            if ($currentEvent !== null) {
                $freeAt = $currentEvent['end'];
                $blockStart = $currentEvent['start'];

                foreach ($parsedEvents as $event) {
                    $timeDiff = $event['start']->diffInMinutes($freeAt, false);

                    if ($timeDiff >= -5 && $timeDiff <= 5 && $event['start']->gte($freeAt)) {
                        $freeAt = $event['end'];
                    }
                }

                $nextBookingAfterFree = null;
                foreach ($parsedEvents as $event) {
                    if ($event['start']->gt($freeAt)) {
                        $nextBookingAfterFree = $event;
                        break;
                    }
                }

                $freeDuration = $nextBookingAfterFree !== null
                    ? $freeAt->diffInMinutes($nextBookingAfterFree['start'])
                    : null;

                return [
                    'name'                     => $roomName,
                    'status'                   => 'occupied',
                    'next_booking'             => null,
                    'available_at'             => $freeAt->timezone(self::TIMEZONE)->format('H:i'),
                    'current_duration_minutes' => $blockStart->diffInMinutes($freeAt),
                    'next_duration_minutes'    => $freeDuration,
                ];
            }

            if ($nextEvent !== null) {
                $busyUntil = $nextEvent['end'];
                $blockStart = $nextEvent['start'];

                foreach ($parsedEvents as $event) {
                    $timeDiff = $event['start']->diffInMinutes($busyUntil, false);

                    if ($timeDiff >= -5 && $timeDiff <= 5 && $event['start']->gte($busyUntil)) {
                        $busyUntil = $event['end'];
                    }
                }

                return [
                    'name'                     => $roomName,
                    'status'                   => 'available',
                    'next_booking'             => $blockStart->timezone(self::TIMEZONE)->format('H:i'),
                    'available_at'             => null,
                    'current_duration_minutes' => null,
                    'next_duration_minutes'    => $blockStart->diffInMinutes($busyUntil),
                ];
            }

            return [
                'name'                     => $roomName,
                'status'                   => 'available',
                'next_booking'             => null,
                'available_at'             => null,
                'current_duration_minutes' => null,
                'next_duration_minutes'    => null,
            ];
        } catch (\Exception $e) {
            Log::error("Google Calendar: failed to fetch events for calendar '{$calendarId}': " . $e->getMessage());

            return $this->unknownRoom($roomName, $e->getMessage());
        }
    }

    private function unknownRoom(string $roomName, string $error): array
    {
        return [
            'name'                     => $roomName,
            'status'                   => 'unknown',
            'next_booking'             => null,
            'available_at'             => null,
            'current_duration_minutes' => null,
            'next_duration_minutes'    => null,
            'error'                    => $error,
        ];
    }
}
