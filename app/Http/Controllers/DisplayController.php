<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use App\Models\Screen;
use App\Models\Setting;
use App\Services\GoogleCalendarService;
use App\Services\TogglTimeTrackingService;
use App\Support\SlideAvailability;
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
        $screen->setRelation(
            'widgets',
            SlideAvailability::filterWidgetsForDisplay($screen->widgets),
        );
        $screen->screen_config = $this->enrichScreenConfig($screen, $screen->screen_config ?? []);

        return Inertia::render('Display/Show', [
            'screen' => $screen,
        ]);
    }

    public function data(Screen $screen): JsonResponse
    {
        $widgets = SlideAvailability::filterWidgetsForDisplay($screen->widgets()->get());

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

        $config['weather'] = $this->fetchWeather();

        if ($type === 'technical') {
            unset($config['rooms']);
            $config['argocd_apps'] = $this->fetchArgoCDApps();
            $football = $this->fetchFootballMatches();
            $config['live'] = $football['live'];
            $config['fixtures'] = $football['fixtures'];
            $f1 = $this->fetchF1Data();
            $config['f1_next_race'] = $f1['next_race'];
            $config['f1_results'] = $f1['results'];
            $config['f1_results_label'] = $f1['results_label'];

            return $config;
        }

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
            'announcements' => $this->getAnnouncementsBlockData($widget),
            'announcement' => $this->getAnnouncementSlideData($widget),
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

    private function fetchArgoCDApps(): array
    {
        $token = config('services.argocd.token');
        $url   = rtrim(config('services.argocd.url', ''), '/');

        if (! $token || ! $url) {
            return [];
        }

        return Cache::remember('argocd_apps', 60, function () use ($token, $url) {
            $response = Http::withToken($token)
                ->withoutVerifying()
                ->timeout(10)
                ->get("{$url}/api/v1/applications");

            if ($response->failed()) {
                return [];
            }

            $items = $response->json('items') ?? [];

            return collect($items)->map(fn (array $app) => [
                'name'      => $app['metadata']['name'] ?? 'unknown',
                'project'   => $app['spec']['project'] ?? 'default',
                'health'    => $app['status']['health']['status'] ?? 'Unknown',
                'sync'      => $app['status']['sync']['status'] ?? 'Unknown',
                'operation' => $app['status']['operationState']['phase'] ?? null,
            ])->values()->toArray();
        }) ?? [];
    }

    private function circuitCoords(string $location): ?array
    {
        $map = [
            'spielberg'         => 'at-1969',
            'abu dhabi'         => 'ae-2009',
            'yas marina'        => 'ae-2009',
            'melbourne'         => 'au-1953',
            'baku'              => 'az-2016',
            'spa-francorchamps' => 'be-1925',
            'spa francorchamps' => 'be-1925',
            'sakhir'            => 'bh-2002',
            'sao paulo'         => 'br-1940',
            'são paulo'         => 'br-1940',
            'montreal'          => 'ca-1978',
            'shanghai'          => 'cn-2004',
            'barcelona'         => 'es-1991',
            'madrid'            => 'es-2026',
            'silverstone'       => 'gb-1948',
            'budapest'          => 'hu-1986',
            'monza'             => 'it-1922',
            'imola'             => 'it-1953',
            'suzuka'            => 'jp-1962',
            'monte carlo'       => 'mc-1929',
            'monaco'            => 'mc-1929',
            'mexico city'       => 'mx-1962',
            'zandvoort'         => 'nl-1948',
            'lusail'            => 'qa-2004',
            'losail'            => 'qa-2004',
            'jeddah'            => 'sa-2021',
            'singapore'         => 'sg-2008',
            'marina bay'        => 'sg-2008',
            'austin'            => 'us-2012',
            'miami'             => 'us-2022',
            'las vegas'         => 'us-2023',
        ];

        $key  = $map[strtolower(trim($location))] ?? null;
        if (! $key) {
            return null;
        }

        $path = storage_path("app/public/circuits/{$key}.geojson");
        if (! file_exists($path)) {
            return null;
        }

        $geo = json_decode(file_get_contents($path), true);

        return $geo['features'][0]['geometry']['coordinates'] ?? null;
    }

    private function fetchF1Data(): array
    {
        $empty = ['next_race' => null, 'results' => [], 'results_label' => null];

        // Return cached data if it has useful content
        $cached = Cache::get('f1_openf1_data');
        if ($cached !== null && ($cached['next_race'] !== null || ! empty($cached['results']))) {
            return $cached;
        }

        $data = (function () use ($empty) {
            $base = 'https://api.openf1.org/v1';
            $year = now()->year;

            $sessionsRes = Http::timeout(10)->get("{$base}/sessions", [
                'session_type' => 'Race',
                'year'         => $year,
            ]);

            if ($sessionsRes->failed()) {
                return $empty;
            }

            $sessions = collect($sessionsRes->json() ?? [])->sortBy('date_start')->values();
            $now      = now();

            $nextSession = $sessions->first(
                fn (array $s) => \Carbon\Carbon::parse($s['date_start'])->gt($now)
            );

            $lastSession = $sessions->last(
                fn (array $s) => \Carbon\Carbon::parse($s['date_end'] ?? $s['date_start'])->lt($now)
            );

            // ── Next race ──────────────────────────────────────────────────────
            $nextRace = null;
            if ($nextSession) {
                $meetingRes = Http::timeout(10)->get("{$base}/meetings", [
                    'meeting_key' => $nextSession['meeting_key'],
                ]);
                $meeting = ($meetingRes->json() ?? [])[0] ?? [];

                $d = \Carbon\Carbon::parse($nextSession['date_start']);

                $circuitLocation = $nextSession['location'] ?? '';
                $nextRace = [
                    'competition' => [
                        'name'     => $meeting['meeting_name']
                                   ?? (($nextSession['country_name'] ?? 'Grand Prix') . ' Grand Prix'),
                        'location' => ['country' => $nextSession['country_name'] ?? null],
                    ],
                    'circuit'        => ['name' => $nextSession['circuit_short_name'] ?? null],
                    'date'           => $d->format('Y-m-d'),
                    'time'           => $d->format('H:i:s'),
                    'circuit_coords' => $this->circuitCoords($circuitLocation),
                ];
            }

            // ── Last race results (top 5) ─────────────────────────────────────
            $results      = [];
            $resultsLabel = null;
            if ($lastSession) {
                $sessionKey = $lastSession['session_key'];

                $posRes    = Http::timeout(15)->get("{$base}/position", ['session_key' => $sessionKey]);
                $driverRes = Http::timeout(10)->get("{$base}/drivers",  ['session_key' => $sessionKey]);

                if ($posRes->ok()) {
                    $positions = collect($posRes->json() ?? [])
                        ->sortBy('date')
                        ->groupBy('driver_number')
                        ->map(fn ($entries) => $entries->last())
                        ->sortBy('position')
                        ->take(5);

                    $drivers = collect($driverRes->ok() ? $driverRes->json() : [])
                        ->keyBy(fn (array $d) => (string) ($d['driver_number'] ?? ''));

                    $results = $positions->map(function (array $pos) use ($drivers): array {
                        $driver = $drivers->get((string) $pos['driver_number'], []);

                        return [
                            'position' => (int) $pos['position'],
                            'driver'   => [
                                'name' => $driver['full_name']
                                       ?? $driver['broadcast_name']
                                       ?? "#{$pos['driver_number']}",
                                'abbr' => $driver['name_acronym'] ?? null,
                            ],
                            'team' => isset($driver['team_name']) ? [
                                'name'   => $driver['team_name'],
                                'colour' => $driver['team_colour'] ?? null,
                            ] : null,
                        ];
                    })->values()->toArray();

                    // Meeting name for the label
                    $meetingRes2  = Http::timeout(10)->get("{$base}/meetings", ['meeting_key' => $lastSession['meeting_key']]);
                    $lastMeeting  = ($meetingRes2->json() ?? [])[0] ?? [];
                    $resultsLabel = $lastMeeting['meeting_name'] ?? null;
                }
            }

            return ['next_race' => $nextRace, 'results' => $results, 'results_label' => $resultsLabel];
        })();

        // Only cache if we got meaningful data; otherwise retry on next request
        if ($data['next_race'] !== null || ! empty($data['results'])) {
            Cache::put('f1_openf1_data', $data, 300);
        }

        return $data;
    }

    private function fetchFootballMatches(): array
    {
        $apiKey = config('services.football_data.api_key');
        $empty  = ['live' => [], 'fixtures' => []];

        if (! $apiKey) {
            return $empty;
        }

        return Cache::remember('football_matches', 60, function () use ($apiKey) {
            // Use the WC competition endpoint so we always get upcoming matches
            // even after today's games go live. Competition 2000 = FIFA World Cup.
            $response = Http::withHeaders(['X-Auth-Token' => $apiKey])
                ->timeout(10)
                ->get('https://api.football-data.org/v4/competitions/2000/matches', [
                    'dateFrom' => now()->format('Y-m-d'),
                    'dateTo'   => now()->addDays(3)->format('Y-m-d'),
                ]);

            if ($response->failed()) {
                return ['live' => [], 'fixtures' => []];
            }

            $matches = $response->json('matches') ?? [];

            $live = collect($matches)
                ->filter(fn (array $m) => in_array($m['status'], ['IN_PLAY', 'PAUSED'], true))
                ->map(fn (array $m): array => [
                    'id'   => (string) $m['id'],
                    'comp' => $m['competition']['name'] ?? $m['competition']['code'] ?? '?',
                    'home' => $m['homeTeam']['shortName'] ?? $m['homeTeam']['name'] ?? '?',
                    'away' => $m['awayTeam']['shortName'] ?? $m['awayTeam']['name'] ?? '?',
                    'hs'   => $m['score']['fullTime']['home'] ?? 0,
                    'as'   => $m['score']['fullTime']['away'] ?? 0,
                    'min'  => isset($m['minute']) && $m['minute'] !== null
                        ? $m['minute'] . "'"
                        : '',
                ])
                ->values()
                ->toArray();

            $fixtures = collect($matches)
                ->filter(fn (array $m) => in_array($m['status'], ['TIMED', 'SCHEDULED'], true))
                ->sortBy('utcDate')
                ->take(4)
                ->map(function (array $m): array {
                    $d = \Carbon\Carbon::parse($m['utcDate'])
                        ->setTimezone('Europe/Amsterdam')
                        ->locale('nl');

                    return [
                        'id'    => (string) $m['id'],
                        'comp'  => $m['competition']['name'] ?? $m['competition']['code'] ?? '?',
                        'label' => ($m['homeTeam']['shortName'] ?? $m['homeTeam']['name'] ?? '?')
                                 . ' – '
                                 . ($m['awayTeam']['shortName'] ?? $m['awayTeam']['name'] ?? '?'),
                        'when'  => $d->isoFormat('ddd D MMM') . ' ' . $d->format('H:i'),
                    ];
                })
                ->values()
                ->toArray();

            return ['live' => $live, 'fixtures' => $fixtures];
        }) ?? ['live' => [], 'fixtures' => []];
    }

    private function fetchWeather(): array
    {
        return Cache::remember('weather_best_nl', 600, function () {
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
        }) ?? [
            'temperature' => 0,
            'condition' => 'Niet beschikbaar',
            'icon' => '❓',
        ];
    }

    private function getClockWeatherData(): array
    {
        return [
            'time' => now()->format('H:i:s'),
            'date' => now()->format('l, j F Y'),
            'weather' => $this->fetchWeather(),
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

    private function getAnnouncementSlideData($widget): array
    {
        $id = $widget->config['announcement_id'] ?? null;
        if (! $id) return [];

        $record = \App\Models\Announcement::find($id);
        return $record ? $record->toArray() : [];
    }

    private function getAnnouncementsBlockData($widget): array
    {
        $config = $widget->config ?? [];
        $selectedIds = $config['selected_announcement_ids'] ?? [];

        if (! empty($selectedIds)) {
            $records = \App\Models\Announcement::whereIn('id', $selectedIds)
                ->get()
                ->keyBy('id');

            $ordered = collect($selectedIds)
                ->map(fn ($id) => $records->get($id)?->toArray())
                ->filter()
                ->values()
                ->toArray();

            return ['slides' => $ordered];
        }

        // Fallback: show all announcements from the central library
        $all = \App\Models\Announcement::latest()->get()->toArray();
        return ['slides' => $all];
    }

    private function getTogglTimeTrackingData(): array
    {
        $service = new TogglTimeTrackingService();
        return $service->getCurrentWeekReport();
    }
}
