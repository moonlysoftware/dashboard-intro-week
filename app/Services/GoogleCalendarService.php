<?php

namespace App\Services;

use Carbon\Carbon;
use Google\Client;
use Google\Service\Calendar;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private ?Calendar $calendarService = null;

    /**
     * Initialize the Google Calendar client using the service account credentials.
     */
    private function getCalendarService(): ?Calendar
    {
        if ($this->calendarService !== null) {
            return $this->calendarService;
        }

        $credentialsPath = config('services.google_calendar.credentials');

        if (!$credentialsPath || !file_exists($credentialsPath)) {
            Log::warning('Google Calendar: credentials file not found at ' . $credentialsPath);
            return null;
        }
    
        try {
            $client = new Client();
            $client->setAuthConfig($credentialsPath);
            $client->setScopes([Calendar::CALENDAR_READONLY]);

            $this->calendarService = new Calendar($client);
            return $this->calendarService;
        } catch (\Exception $e) {
            Log::error('Google Calendar: failed to initialize client: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get the availability for a single room based on its Google Calendar ID.
     *
     * Returns an array with:
     *  - name:            string  (pass-through from caller)
     *  - status:          'available' | 'occupied'
     *  - next_booking:    string|null  (HH:MM when next event starts, if currently free)
     *  - available_at:    string|null  (HH:MM when current event ends, if currently occupied)
     *  - duration_minutes: int|null    (duration of current/next booking block in minutes)
     */
    public function getRoomAvailability(string $calendarId, string $roomName): array
    {
        $service = $this->getCalendarService();

        if ($service === null) {
            return $this->unavailableRoom($roomName);
        }

        try {
            $now = Carbon::now();
            $endOfDay = $now->copy()->endOfDay();

            $events = $service->events->listEvents($calendarId, [
                'timeMin'      => $now->toRfc3339String(),
                'timeMax'      => $endOfDay->toRfc3339String(),
                'singleEvents' => true,
                'orderBy'      => 'startTime',
                'maxResults'   => 10,
            ]);

            $items = $events->getItems();

            // Parse all events into a usable array
            $parsedEvents = [];
            foreach ($items as $event) {
                $startRaw = $event->getStart()->getDateTime() ?? $event->getStart()->getDate();
                $endRaw   = $event->getEnd()->getDateTime()   ?? $event->getEnd()->getDate();

                $parsedEvents[] = [
                    'start'   => Carbon::parse($startRaw),
                    'end'     => Carbon::parse($endRaw),
                    'summary' => $event->getSummary(),
                ];
            }

            $currentEvent = null;
            $nextEvent    = null;

            // Find current and next events
            foreach ($parsedEvents as $event) {
                if ($event['start']->lte($now) && $event['end']->gte($now)) {
                    $currentEvent = $event;
                } elseif ($event['start']->gt($now) && $nextEvent === null) {
                    $nextEvent = $event;
                }
            }

            // If room is currently occupied, find when it becomes free (accounting for consecutive bookings)
            if ($currentEvent !== null) {
                $freeAt = $currentEvent['end'];
                $blockStart = $currentEvent['start'];
                
                // Look for consecutive bookings (events starting within 5 minutes of previous end)
                foreach ($parsedEvents as $event) {
                    // Check if this event starts at or very close to when the current occupied period ends
                    $timeDiff = $event['start']->diffInMinutes($freeAt, false);
                    
                    if ($timeDiff >= -5 && $timeDiff <= 5 && $event['start']->gte($freeAt)) {
                        $freeAt = $event['end']; // Extend the occupied period
                    }
                }
                
                $durationMinutes = $blockStart->diffInMinutes($freeAt);
                Log::info("Room '{$roomName}' occupied for {$durationMinutes} minutes until " . $freeAt->format('H:i'));
                
                return [
                    'name'             => $roomName,
                    'status'           => 'occupied',
                    'next_booking'     => null,
                    'available_at'     => $freeAt->format('H:i'),
                    'duration_minutes' => $durationMinutes,
                ];
            }

            // Room is available - check for consecutive future bookings
            if ($nextEvent !== null) {
                $busyUntil = $nextEvent['end'];
                $blockStart = $nextEvent['start'];
                
                // Look for consecutive bookings after the next event
                foreach ($parsedEvents as $event) {
                    $timeDiff = $event['start']->diffInMinutes($busyUntil, false);
                    
                    if ($timeDiff >= -5 && $timeDiff <= 5 && $event['start']->gte($busyUntil)) {
                        $busyUntil = $event['end'];
                    }
                }
                
                $nextBookingDuration = $blockStart->diffInMinutes($busyUntil);
                Log::info("Room '{$roomName}' next booking at " . $nextEvent['start']->format('H:i') . " for {$nextBookingDuration} minutes");
                
                return [
                    'name'             => $roomName,
                    'status'           => 'available',
                    'next_booking'     => $nextEvent['start']->format('H:i'),
                    'available_at'     => null,
                    'duration_minutes' => $nextBookingDuration,
                ];
            }

            return [
                'name'             => $roomName,
                'status'           => 'available',
                'next_booking'     => null,
                'available_at'     => null,
                'duration_minutes' => null,
            ];
        } catch (\Exception $e) {
            Log::error("Google Calendar: failed to fetch events for calendar '{$calendarId}': " . $e->getMessage());
            return $this->unavailableRoom($roomName);
        }
    }

    /**
     * Fallback entry when the calendar cannot be reached.
     */
    private function unavailableRoom(string $roomName): array
    {
        return [
            'name'             => $roomName,
            'status'           => 'available',
            'next_booking'     => null,
            'available_at'     => null,
            'duration_minutes' => null,
        ];
    }
}
