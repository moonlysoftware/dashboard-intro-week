<?php

namespace App\Http\Controllers;

use App\Models\Screen;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScreenController extends Controller
{
    public function index(): Response
    {
        $screens = Screen::with(['widgets' => function ($query) {
            $query->orderBy('grid_order');
        }])->withCount('widgets')->latest()->get();

        return Inertia::render('Dashboard/Management/Index', [
            'screens' => $screens,
            'overlay' => [
                'rooms' => Setting::get('overlay_rooms', []),
                'legacy_rooms' => $this->findLegacyOverlayRooms($screens),
                'calendar_configured' => \App\Services\GoogleCalendarService::isConfigured(),
                'calendar_credentials_path' => config('services.google_calendar.credentials'),
            ],
            'widgetTypesByScreenType' => [
                'slideshow' => [
                    'agenda' => 'Agenda',
                    'birthdays' => 'Verjaardagen',
                    'appreciation' => 'Klantwaardering',
                    'announcement' => 'Aankondiging',
                ],
                'general' => [
                    'toggl_time_tracking' => 'Toggl Leaderboard',
                    'birthday' => 'Verjaardagen (compact)',
                    'spotlight_event' => 'Uitgelicht evenement',
                    'moment_photo' => 'Moonly Moment',
                ],
                'technical' => [],
            ],
            'widgetTypes' => [
                // Slideshow slides
                'agenda' => 'Agenda',
                'birthdays' => 'Verjaardagen',
                'appreciation' => 'Klantwaardering',
                'announcement' => 'Aankondiging',
                // General screen blocks
                'toggl_time_tracking' => 'Toggl Leaderboard',
                'birthday' => 'Verjaardagen (compact)',
                'spotlight_event' => 'Uitgelicht evenement',
                'moment_photo' => 'Moonly Moment',
                // Legacy
                'room_availability' => 'Room Availability',
                'clock_weather' => 'Clock/Date/Weather',
                'announcements' => 'Announcements',
                'image_widget' => 'Image Slideshow',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'refresh_interval' => 'sometimes|integer|min:5|max:300',
            'screen_type' => 'sometimes|in:slideshow,general,technical',
            'screen_config' => 'sometimes|nullable|array',
        ]);

        if (! isset($validated['refresh_interval'])) {
            $validated['refresh_interval'] = 30;
        }

        if (($validated['screen_type'] ?? 'slideshow') === 'slideshow') {
            $validated['screen_config'] = array_merge(
                ['cycleSeconds' => 60],
                $validated['screen_config'] ?? [],
            );
        }

        $screen = Screen::create($validated);

        return redirect()->route('screens.index', ['active' => $screen->id])->with('success', 'Screen created successfully.');
    }

    public function update(Request $request, Screen $screen): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'refresh_interval' => 'sometimes|integer|min:5|max:300',
            'screen_type' => 'sometimes|in:slideshow,general,technical',
            'screen_config' => 'sometimes|nullable|array',
        ]);

        $screen->update($validated);

        return redirect()->route('screens.index', ['active' => $screen->id])->with('success', 'Screen updated successfully.');
    }

    public function updateLayout(Request $request, Screen $screen): JsonResponse
    {
        $validated = $request->validate([
            'layout' => 'sometimes|in:bento_start_small,bento_start_large',
            'view_mode' => 'sometimes|in:grid,single_widget',
            'featured_widget_id' => 'sometimes|nullable|exists:widgets,id',
        ]);

        if (isset($validated['featured_widget_id'])) {
            $widgetBelongsToScreen = $screen->widgets()->where('id', $validated['featured_widget_id'])->exists();
            if (!$widgetBelongsToScreen) {
                return response()->json(['error' => 'Widget does not belong to this screen.'], 422);
            }
        }

        $screen->update($validated);

        return response()->json([
            'layout' => $screen->layout,
            'view_mode' => $screen->view_mode,
            'featured_widget_id' => $screen->featured_widget_id,
        ]);
    }

    public function updateConfig(Request $request, Screen $screen): JsonResponse
    {
        $validated = $request->validate([
            'screen_config' => 'required|array',
        ]);

        $merged = array_merge($screen->screen_config ?? [], $validated['screen_config']);
        $screen->update(['screen_config' => $merged]);

        return response()->json(['screen_config' => $screen->fresh()->screen_config]);
    }

    public function destroy(Screen $screen): RedirectResponse
    {
        $screen->delete();

        return redirect()->route('screens.index')->with('success', 'Screen deleted successfully.');
    }

    private function findLegacyOverlayRooms($screens): array
    {
        foreach ($screens as $screen) {
            $rooms = $screen->screen_config['rooms'] ?? [];
            if (! empty($rooms)) {
                return $rooms;
            }
        }

        foreach ($screens as $screen) {
            foreach ($screen->widgets as $widget) {
                if ($widget->widget_type !== 'room_availability') {
                    continue;
                }
                $rooms = $widget->config['rooms'] ?? [];
                if (! empty($rooms)) {
                    return $rooms;
                }
            }
        }

        return [];
    }
}
