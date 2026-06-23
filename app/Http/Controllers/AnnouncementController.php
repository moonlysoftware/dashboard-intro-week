<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Announcement::latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'style'    => 'nullable|string|in:split,overlay',
            'badge'    => 'nullable|string|max:255',
            'title'    => 'nullable|string|max:255',
            'photo'    => 'nullable|string',
            'pos'      => 'nullable|string|max:100',
            'date'     => 'nullable|string|max:100',
            'time'     => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'body'     => 'nullable|string',
        ]);

        $announcement = Announcement::create($validated);

        return response()->json($announcement, 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'style'    => 'nullable|string|in:split,overlay',
            'badge'    => 'nullable|string|max:255',
            'title'    => 'nullable|string|max:255',
            'photo'    => 'nullable|string',
            'pos'      => 'nullable|string|max:100',
            'date'     => 'nullable|string|max:100',
            'time'     => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'body'     => 'nullable|string',
        ]);

        $announcement->update($validated);

        return response()->json($announcement);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(null, 204);
    }
}
