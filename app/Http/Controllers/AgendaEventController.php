<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgendaEventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = AgendaEvent::orderByRaw('when_date IS NULL, when_date ASC')
            ->orderBy('id')
            ->get();

        return response()->json($events);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'when_label' => 'required|string|max:255',
            'when_date'  => 'nullable|date',
            'location'   => 'nullable|string|max:255',
            'tagline'    => 'nullable|string',
            'accent'     => 'nullable|string|max:30',
            'grad'       => 'nullable|string',
            'photo'      => 'nullable|string',
            'pos'        => 'nullable|string|max:100',
        ]);

        $event = AgendaEvent::create($validated);

        return response()->json($event, 201);
    }

    public function update(Request $request, AgendaEvent $agendaEvent): JsonResponse
    {
        $validated = $request->validate([
            'title'      => 'sometimes|required|string|max:255',
            'when_label' => 'sometimes|required|string|max:255',
            'when_date'  => 'nullable|date',
            'location'   => 'nullable|string|max:255',
            'tagline'    => 'nullable|string',
            'accent'     => 'nullable|string|max:30',
            'grad'       => 'nullable|string',
            'photo'      => 'nullable|string',
            'pos'        => 'nullable|string|max:100',
        ]);

        $agendaEvent->update($validated);

        return response()->json($agendaEvent);
    }

    public function destroy(AgendaEvent $agendaEvent): JsonResponse
    {
        $agendaEvent->delete();

        return response()->json(null, 204);
    }
}
