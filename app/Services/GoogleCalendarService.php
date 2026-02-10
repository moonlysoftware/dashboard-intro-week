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
     *  - name:          string  (pass-through from caller)
     *  - status:        'available' | 'occupied'
     *  - next_booking:  string|null  (HH:MM when next event starts, if currently free)
     *  - available_at:  string|null  (HH:MM when current event ends, if currently occupied)
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

            $currentEvent = null;
            $nextEvent    = null;

            foreach ($items as $event) {
                $startRaw = $event->getStart()->getDateTime() ?? $event->getStart()->getDate();
                $endRaw   = $event->getEnd()->getDateTime()   ?? $event->getEnd()->getDate();

                $start = Carbon::parse($startRaw);
                $end   = Carbon::parse($endRaw);

                if ($start->lte($now) && $end->gte($now)) {
                    $currentEvent = ['start' => $start, 'end' => $end, 'summary' => $event->getSummary()];
                } elseif ($start->gt($now) && $nextEvent === null) {
                    $nextEvent = ['start' => $start, 'end' => $end, 'summary' => $event->getSummary()];
                }
            }

            if ($currentEvent !== null) {
                return [
                    'name'         => $roomName,
                    'status'       => 'occupied',
                    'next_booking' => null,
                    'available_at' => $currentEvent['end']->format('H:i'),
                ];
            }

            return [
                'name'         => $roomName,
                'status'       => 'available',
                'next_booking' => $nextEvent ? $nextEvent['start']->format('H:i') : null,
                'available_at' => null,
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
            'name'         => $roomName,
            'status'       => 'available',
            'next_booking' => null,
            'available_at' => null,
        ];
    }
}
