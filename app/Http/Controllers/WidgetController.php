<?php

namespace App\Http\Controllers;

use App\Models\Screen;
use App\Models\Widget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WidgetController extends Controller
{
    public function store(Request $request, Screen $screen): JsonResponse
    {
        $validated = $request->validate([
            'widget_type' => 'required|string|in:birthday,room_availability,clock_weather,announcements,toggl_time_tracking,image_widget',
            'config' => 'nullable|array',
            'grid_col_span' => 'required|integer|min:1|max:12',
            'grid_row_span' => 'required|integer|min:1|max:6',
            'grid_order' => 'required|integer|min:0',
        ]);

        if (empty($validated['config'])) {
            $existingConfig = Widget::where('widget_type', $validated['widget_type'])
                ->whereNotNull('config')
                ->value('config');

            if ($existingConfig) {
                $validated['config'] = $existingConfig;
            }
        }

        $widget = $screen->widgets()->create($validated);

        return response()->json($widget, 201);
    }

    public function update(Request $request, Widget $widget): JsonResponse
    {
        $validated = $request->validate([
            'widget_type' => 'sometimes|string|in:birthday,room_availability,clock_weather,announcements,toggl_time_tracking,image_widget',
            'config' => 'nullable|array',
            'grid_col_span' => 'sometimes|integer|min:1|max:12',
            'grid_row_span' => 'sometimes|integer|min:1|max:6',
            'grid_order' => 'sometimes|integer|min:0',
        ]);

        if (array_key_exists('config', $validated)) {
            // image_widget has per-instance config; all other widget types share config globally
            if ($widget->widget_type === 'image_widget') {
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
