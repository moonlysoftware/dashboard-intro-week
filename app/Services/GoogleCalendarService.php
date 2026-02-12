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
     *  - name:                    string       (pass-through from caller)
     *  - status:                  'available' | 'occupied'
     *  - next_booking:            string|null  (HH:MM when next event starts, if currently free)
     *  - available_at:            string|null  (HH:MM when current event ends, if currently occupied)
     *  - current_duration_minutes: int|null    (if occupied: duration of current booking block)
     *  - next_duration_minutes:    int|null    (if occupied: duration free until next booking; if available: duration of next booking)
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

            // If room is currently occupied
            if ($currentEvent !== null) {
                $freeAt = $currentEvent['end'];
                $blockStart = $currentEvent['start'];
                
                // Look for consecutive bookings in current block
                foreach ($parsedEvents as $event) {
                    $timeDiff = $event['start']->diffInMinutes($freeAt, false);
                    
                    if ($timeDiff >= -5 && $timeDiff <= 5 && $event['start']->gte($freeAt)) {
                        $freeAt = $event['end'];
                    }
                }
                
                $currentDuration = $blockStart->diffInMinutes($freeAt);
                
                // Find the next booking after current block ends
                $nextBookingAfterFree = null;
                foreach ($parsedEvents as $event) {
                    if ($event['start']->gt($freeAt)) {
                        $nextBookingAfterFree = $event;
                        break;
                    }
                }
                
                // Calculate how long the room will be free after current booking
                $freeDuration = null;
                if ($nextBookingAfterFree !== null) {
                    $freeDuration = $freeAt->diffInMinutes($nextBookingAfterFree['start']);
                }
                
                Log::info("Room '{$roomName}' occupied for {$currentDuration} minutes until " . $freeAt->format('H:i') . 
                         ($freeDuration ? ", then free for {$freeDuration} minutes" : ", then free rest of day"));
                
                return [
                    'name'                      => $roomName,
                    'status'                    => 'occupied',
                    'next_booking'              => null,
                    'available_at'              => $freeAt->format('H:i'),
                    'current_duration_minutes'  => $currentDuration,
                    'next_duration_minutes'     => $freeDuration,
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
                    'name'                      => $roomName,
                    'status'                    => 'available',
                    'next_booking'              => $nextEvent['start']->format('H:i'),
                    'available_at'              => null,
                    'current_duration_minutes'  => null,
                    'next_duration_minutes'     => $nextBookingDuration,
                ];
            }

            return [
                'name'                      => $roomName,
                'status'                    => 'available',
                'next_booking'              => null,
                'available_at'              => null,
                'current_duration_minutes'  => null,
                'next_duration_minutes'     => null,
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
            'name'                      => $roomName,
            'status'                    => 'available',
            'next_booking'              => null,
            'available_at'              => null,
            'current_duration_minutes'  => null,
            'next_duration_minutes'     => null,
        ];
    }
}
