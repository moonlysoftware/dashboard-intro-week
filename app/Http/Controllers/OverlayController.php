<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OverlayController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rooms' => 'present|array',
            'rooms.*.name' => 'nullable|string|max:255',
            'rooms.*.calendar_id' => 'nullable|string|max:255',
            'rooms.*.subtext' => 'nullable|string|max:255',
            'rooms.*.id' => 'nullable|string|max:255',
        ]);

        $rooms = collect($validated['rooms'])
            ->filter(fn (array $room) => ! empty($room['name']) || ! empty($room['calendar_id']))
            ->values()
            ->all();

        Setting::set('overlay_rooms', $rooms, 'json');

        return response()->json([
            'rooms' => Setting::get('overlay_rooms', []),
        ]);
    }
}
