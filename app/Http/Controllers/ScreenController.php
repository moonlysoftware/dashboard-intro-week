<?php

namespace App\Http\Controllers;

use App\Models\Screen;
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

        return Inertia::render('Dashboard/Screens/Index', [
            'screens' => $screens,
            'widgetTypes' => [
                'birthday' => 'Birthdays',
                'room_availability' => 'Room Availability',
                'clock_weather' => 'Clock/Date/Weather',
                'announcements' => 'Announcements',
                'toggl_time_tracking' => 'Toggl Time Tracking',
                'image_widget' => 'Image Slideshow',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'refresh_interval' => 'required|integer|min:5|max:300',
        ]);

        $screen = Screen::create($validated);

        return redirect()->route('screens.index', ['active' => $screen->id])->with('success', 'Screen created successfully.');
    }

    public function update(Request $request, Screen $screen): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'refresh_interval' => 'required|integer|min:5|max:300',
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

    public function destroy(Screen $screen): RedirectResponse
    {
        $screen->delete();

        return redirect()->route('screens.index')->with('success', 'Screen deleted successfully.');
    }
}
