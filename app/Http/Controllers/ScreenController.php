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
                'birthday' => 'Verjaardagen',
                'room_availability' => 'Ruimte Beschikbaarheid',
                'clock_weather' => 'Klok/Datum/Weer',
                'announcements' => 'Mededelingen',
                'toggl_time_tracking' => 'Toggl Uren Tracking',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Screens/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'refresh_interval' => 'required|integer|min:5|max:300',
            'is_active' => 'boolean',
        ]);

        Screen::create($validated);

        return redirect()->route('screens.index')->with('success', 'Screen created successfully.');
    }

    public function edit(Screen $screen): Response
    {
        $screen->load('widgets');

        return Inertia::render('Dashboard/Screens/Edit', [
            'screen' => $screen,
            'widgetTypes' => [
                'birthday' => 'Verjaardagen',
                'room_availability' => 'Ruimte Beschikbaarheid',
                'clock_weather' => 'Klok/Datum/Weer',
                'announcements' => 'Mededelingen',
                'toggl_time_tracking' => 'Toggl Uren Tracking',
            ],
        ]);
    }

    public function update(Request $request, Screen $screen): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'refresh_interval' => 'required|integer|min:5|max:300',
            'is_active' => 'boolean',
        ]);

        $screen->update($validated);

        return redirect()->route('screens.index')->with('success', 'Screen updated successfully.');
    }

    public function updateLayout(Request $request, Screen $screen): JsonResponse
    {
        $validated = $request->validate([
            'layout' => 'required|in:bento_start_small,bento_start_large',
        ]);

        $screen->update($validated);

        return response()->json(['layout' => $screen->layout]);
    }

    public function destroy(Screen $screen): RedirectResponse
    {
        $screen->delete();

        return redirect()->route('screens.index')->with('success', 'Screen deleted successfully.');
    }
}
