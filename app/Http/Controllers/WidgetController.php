<?php

namespace App\Http\Controllers;

use App\Models\Screen;
use App\Models\Widget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WidgetController extends Controller
{
    private const SLIDE_TYPES = ['agenda', 'birthdays', 'appreciation', 'announcement'];
    private const LEGACY_TYPES = ['birthday', 'room_availability', 'clock_weather', 'announcements', 'toggl_time_tracking', 'image_widget', 'spotlight_event', 'moment_photo'];

    public function store(Request $request, Screen $screen): JsonResponse
    {
        $allTypes = implode(',', array_merge(self::SLIDE_TYPES, self::LEGACY_TYPES));

        $validated = $request->validate([
            'widget_type' => "required|string|in:{$allTypes}",
            'config' => 'nullable|array',
            'grid_col_span' => 'sometimes|integer|min:1|max:12',
            'grid_row_span' => 'sometimes|integer|min:1|max:6',
            'grid_order' => 'required|integer|min:0',
        ]);

        $widget = $screen->widgets()->create($validated);

        return response()->json($widget, 201);
    }

    public function update(Request $request, Widget $widget): JsonResponse
    {
        $allTypes = implode(',', array_merge(self::SLIDE_TYPES, self::LEGACY_TYPES));

        $validated = $request->validate([
            'widget_type' => "sometimes|string|in:{$allTypes}",
            'config' => 'nullable|array',
            'grid_col_span' => 'sometimes|integer|min:1|max:12',
            'grid_row_span' => 'sometimes|integer|min:1|max:6',
            'grid_order' => 'sometimes|integer|min:0',
        ]);

        if (array_key_exists('config', $validated)) {
            // Slide types and image_widget are per-instance; legacy widget types share config globally
            $perInstance = in_array($widget->widget_type, array_merge(self::SLIDE_TYPES, ['image_widget']));
            if ($perInstance) {
                $widget->update(['config' => $validated['config']]);
            } else {
                Widget::where('widget_type', $widget->widget_type)
                    ->update(['config' => json_encode($validated['config'])]);
            }
            $widget->refresh();
        } else {
            $widget->update($validated);
        }

        return response()->json($widget);
    }

    public function destroy(Widget $widget): JsonResponse
    {
        $widget->delete();

        return response()->json(['message' => 'Widget deleted successfully.']);
    }
}
