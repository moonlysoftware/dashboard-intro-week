<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        $settings = Setting::all()->keyBy('key');

        return Inertia::render('Dashboard/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.type' => 'required|string|in:string,integer,boolean,json',
        ]);

        foreach ($validated['settings'] as $settingData) {
            Setting::set($settingData['key'], $settingData['value'], $settingData['type']);
        }

        return redirect()->route('settings.index')->with('success', 'Settings updated successfully.');
    }
}
