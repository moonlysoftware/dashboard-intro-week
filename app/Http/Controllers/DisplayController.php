<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use App\Models\Screen;
use App\Models\Setting;
use App\Services\GoogleCalendarService;
use App\Services\TogglTimeTrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class DisplayController extends Controller
{
    public function show(Screen $screen): Response
    {
        $screen->load('widgets');
        $screen->screen_config = $this->enrichScreenConfig($screen, $screen->screen_config ?? []);

        return Inertia::render('Display/Show', [
            'screen' => $screen,
        ]);
    }

    public function data(Screen $screen): JsonResponse
    {
        $widgets = $screen->widgets()->get();

        $widgetsWithData = $widgets->map(function ($widget) {
            return [
                'id' => $widget->id,
                'widget_type' => $widget->widget_type,
                'config' => $widget->config,
                'grid_col_span' => $widget->grid_col_span,
                'grid_row_span' => $widget->grid_row_span,
                'grid_order' => $widget->grid_order,
                'data' => $this->getWidgetData($widget),
            ];
        });

        return response()->json([
            'widgets' => $widgetsWithData,
            'refresh_interval' => $screen->refresh_interval,
            'layout' => $screen->layout,
            'view_mode' => $screen->view_mode,
            'featured_widget_id' => $screen->featured_widget_id,
            'screen_type' => $screen->screen_type ?? 'slideshow',
            'screen_config' => $this->enrichScreenConfig($screen, $screen->screen_config ?? []),
        ]);
    }

    /**
     * Resolve room availability for the AppBar from global overlay config.
     */
    private function enrichScreenConfig(Screen $screen, ?array $config): array
    {
        $config = $this->normalizeScreenConfig($config);
        $type = $screen->screen_type ?? 'slideshow';

        if (! in_array($type, ['slideshow', 'general'], true)) {
            unset($config['rooms']);

            return $config;
        }

        $rooms = Setting::get('overlay_rooms', []);
        if (empty($rooms)) {
            $rooms = $config['rooms'] ?? [];
        }

        if (empty($rooms)) {
            return $config;
        }

        $service = new GoogleCalendarService();
        $config['rooms'] = collect($rooms)
            ->map(fn (array $room) => $this->resolveRoomForDisplay($room, $service))
            ->values()
            ->all();

        return $config;
    }

    private function resolveRoomForDisplay(array $room, GoogleCalendarService $service): array
    {
        $id = $room['id'] ?? ('room-' . md5($room['name'] ?? uniqid()));
        $name = $room['name'] ?? 'Onbekende ruimte';
        $calendarId = $room['calendar_id'] ?? null;

        if ($calendarId) {
            $availability = $service->getRoomAvailability($calendarId, $name);
            $status = $availability['status'] ?? 'unknown';

            if ($status === 'unknown') {
                return [
                    'id'     => $id,
                    'name'   => $name,
                    'free'   => null,
                    'until'  => null,
                    'status' => 'unknown',
                ];
            }

            $free = $status === 'available';
            $until = $free
                ? ($availability['next_booking'] ?? null)
                : ($availability['available_at'] ?? null);

            return [
                'id'     => $id,
                'name'   => $name,
                'free'   => $free,
                'until'  => $until,
                'status' => $status,
            ];
        }

        $free = array_key_exists('free', $room)
            ? (bool) $room['free']
            : !($room['busy'] ?? false);

        $sub = $room['sub'] ?? $room['subtext'] ?? null;

        return [
            'id'    => $id,
            'name'  => $name,
            'free'  => $free,
            'until' => null,
            'sub'   => $sub ?: null,
        ];
    }

    private function normalizeScreenConfig(?array $config): array
    {
        if (empty($config) || array_is_list($config)) {
            return [];
        }

        return $config;
    }

    private function getWidgetData($widget): array
    {
        return match ($widget->widget_type) {
            'birthday', 'birthdays' => $this->getBirthdayData(),
            'room_availability' => $this->getRoomAvailabilityData($widget),
            'clock_weather' => $this->getClockWeatherData(),
            'announcements', 'announcement' => $this->getAnnouncementsData($widget),
            'toggl_time_tracking' => $this->getTogglTimeTrackingData(),
            'agenda' => $this->getAgendaData($widget),
            // Config-driven types — no external data needed
            'appreciation', 'spotlight_event', 'moment_photo' => [],
            default => [],
        };
    }

    private function getAgendaData($widget): array
    {
        $config = $widget->config ?? [];
        $selectedIds = $config['selected_ids'] ?? [];

        if (! empty($selectedIds)) {
            // Slideshow: return only selected events, in selection order
            $events = AgendaEvent::whereIn('id', $selectedIds)->get()->keyBy('id');

            return collect($selectedIds)
                ->map(fn ($id) => $events->get($id))
                ->filter()
                ->values()
                ->toArray();
        }

        // General screen: return all events sorted by date (nulls last), max 6
        return AgendaEvent::orderByRaw('when_date IS NULL, when_date ASC')
            ->limit(6)
            ->get()
            ->toArray();
    }

    private function getBirthdayData(): array
    {
        return [
            'birthdays' => [
                ['name' => 'Jan Jansen', 'date' => now()->addDays(2)->format('Y-m-d'), 'age' => 32],
                ['name' => 'Piet Pietersen', 'date' => now()->addDays(5)->format('Y-m-d'), 'age' => 45],
                ['name' => 'Klaas de Vries', 'date' => now()->addDays(7)->format('Y-m-d'), 'age' => 28],
            ],
        ];
    }

    private function getRoomAvailabilityData($widget): array
    {
        $config = $widget->config ?? [];
        $rooms  = $config['rooms'] ?? [];

        // Fallback: gebruik mock data als er geen ruimtes geconfigureerd zijn
        if (empty($rooms)) {
            return [
                'rooms' => [
                    ['name' => 'Vergaderzaal A', 'status' => 'available', 'next_booking' => '14:00', 'available_at' => null],
                    ['name' => 'Vergaderzaal B', 'status' => 'occupied', 'next_booking' => null, 'available_at' => '11:30'],
                    ['name' => 'Vergaderzaal C', 'status' => 'available', 'next_booking' => '16:00', 'available_at' => null],
                    ['name' => 'Boardroom', 'status' => 'occupied', 'next_booking' => null, 'available_at' => '15:00'],
                ],
            ];
        }

        $service = new GoogleCalendarService();

        $roomData = collect($rooms)->map(function ($room) use ($service) {
            $calendarId = $room['calendar_id'] ?? null;
            $roomName   = $room['name'] ?? 'Onbekende ruimte';

            if (!$calendarId) {
                return [
                    'name'         => $roomName,
                    'status'       => 'available',
                    'next_booking' => null,
                    'available_at' => null,
                ];
            }

            return $service->getRoomAvailability($calendarId, $roomName);
        })->values()->toArray();

        return ['rooms' => $roomData];
    }

    private function getClockWeatherData(): array
    {
        $weather = Cache::remember('weather_best_nl', 600, function () {
            $response = Http::get('https://api.open-meteo.com/v1/forecast?latitude=51.5075&longitude=5.3903&hourly=temperature_2m', [
                'latitude' => 51.51,
                'longitude' => 5.39,
                'current' => 'temperature_2m,weather_code',
                'timezone' => 'Europe/Amsterdam',
            ]);

            if ($response->failed()) {
                return null;
            }

            $data = $response->json('current');
            $code = $data['weather_code'] ?? 0;

            return [
                'temperature' => round($data['temperature_2m'] ?? 0),
                'condition' => $this->weatherCondition($code),
                'icon' => $this->weatherIcon($code),
            ];
        });

        return [
            'time' => now()->format('H:i:s'),
            'date' => now()->format('l, j F Y'),
            'weather' => $weather ?? [
                'temperature' => 0,
                'condition' => 'Niet beschikbaar',
                'icon' => '❓',
            ],
        ];
    }

    private function weatherCondition(int $code): string
    {
        return match (true) {
            $code === 0 => 'Onbewolkt',
            $code <= 3 => 'Gedeeltelijk bewolkt',
            in_array($code, [45, 48]) => 'Mistig',
            in_array($code, [51, 53, 55]) => 'Motregen',
            in_array($code, [61, 63, 65]) => 'Regenachtig',
            in_array($code, [66, 67]) => 'IJzel',
            in_array($code, [71, 73, 75, 77]) => 'Sneeuw',
            in_array($code, [80, 81, 82]) => 'Regenbuien',
            in_array($code, [85, 86]) => 'Sneeuwbuien',
            in_array($code, [95, 96, 99]) => 'Onweer',
            default => 'Bewolkt',
        };
    }

    private function weatherIcon(int $code): string
    {
        return match (true) {
            $code === 0 => '☀️',
            $code <= 3 => '⛅',
            in_array($code, [45, 48]) => '🌫️',
            in_array($code, [51, 53, 55, 61, 63, 65, 80, 81, 82]) => '🌧️',
            in_array($code, [66, 67]) => '🌧️',
            in_array($code, [71, 73, 75, 77, 85, 86]) => '❄️',
            in_array($code, [95, 96, 99]) => '⛈️',
            default => '☁️',
        };
    }

    private function getAnnouncementsData($widget): array
    {
        $config = $widget->config ?? [];
        $announcements = array_slice($config['announcements'] ?? [], 0, 5);

        return [
            'announcements' => $announcements,
        ];
    }

    private function getTogglTimeTrackingData(): array
    {
        $service = new TogglTimeTrackingService();
        return $service->getCurrentWeekReport();
    }
}
