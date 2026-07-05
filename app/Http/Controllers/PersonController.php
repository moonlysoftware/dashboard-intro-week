<?php

namespace App\Http\Controllers;

use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PersonController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Person::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'birth_date'           => 'required|date',
            'jubileum_start_date'  => 'nullable|date',
            'photo'                => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            Storage::disk('public')->makeDirectory('birthdays');
            $photoPath = '/storage/' . $request->file('photo')->store('birthdays', 'public');
        }

        $person = Person::create([
            'name'                => $validated['name'],
            'birth_date'          => $validated['birth_date'],
            'jubileum_start_date' => $validated['jubileum_start_date'] ?? null,
            'photo'               => $photoPath,
        ]);

        return response()->json($person, 201);
    }

    public function update(Request $request, Person $person): JsonResponse
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'birth_date'           => 'required|date',
            'jubileum_start_date'  => 'nullable|date',
            'photo'                => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        $photoPath = $person->photo;
        if ($request->hasFile('photo')) {
            if ($photoPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $photoPath));
            }
            Storage::disk('public')->makeDirectory('birthdays');
            $photoPath = '/storage/' . $request->file('photo')->store('birthdays', 'public');
        }

        $person->update([
            'name'                => $validated['name'],
            'birth_date'          => $validated['birth_date'],
            'jubileum_start_date' => $validated['jubileum_start_date'] ?? null,
            'photo'               => $photoPath,
        ]);

        return response()->json($person);
    }

    public function destroy(Person $person): JsonResponse
    {
        if ($person->photo) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $person->photo));
        }
        $person->delete();

        return response()->json(null, 204);
    }
}
