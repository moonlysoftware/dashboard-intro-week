<?php

namespace App\Http\Controllers;

use App\Models\Screen;
use App\Services\TogglTimeTrackingService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class DisplayController extends Controller
{
    public function show(Screen $screen): Response
    {
        if (!$screen->is_active) {
            abort(404, 'Screen is not active');
        }

        $screen->load('widgets');

        return Inertia::render('Display/Show', [
            'screen' => $screen,
        ]);
    }

    public function data(Screen $screen): JsonResponse
    {
        if (!$screen->is_active) {
            abort(404, 'Screen is not active');
        }

        $widgets = $screen->widgets()->get();

        // Generate mock data for each widget
        $widgetsWithData = $widgets->map(function ($widget) {
            return [
                'id' => $widget->id,
                'widget_type' => $widget->widget_type,
                'config' => $widget->config,
                'grid_col_span' => $widget->grid_col_span,
                'grid_row_span' => $widget->grid_row_span,
                'grid_order' => $widget->grid_order,
                'data' => $this->getWidgetData($widget),
            ];
        });

        return response()->json([
            'widgets' => $widgetsWithData,
            'refresh_interval' => $screen->refresh_interval,
        ]);
    }

    private function getWidgetData($widget): array
    {
        // Generate mock data based on widget type
        return match ($widget->widget_type) {
            'birthday' => $this->getBirthdayData(),
            'room_availability' => $this->getRoomAvailabilityData(),
            'clock_weather' => $this->getClockWeatherData(),
            'announcements' => $this->getAnnouncementsData(),
            'toggl_time_tracking' => $this->getTogglTimeTrackingData(),
            default => [],
        };
    }

    private function getBirthdayData(): array
    {
        return [
            'birthdays' => [
                ['name' => 'Jan Jansen', 'date' => now()->addDays(2)->format('Y-m-d'), 'age' => 32],
                ['name' => 'Piet Pietersen', 'date' => now()->addDays(5)->format('Y-m-d'), 'age' => 45],
                ['name' => 'Klaas de Vries', 'date' => now()->addDays(7)->format('Y-m-d'), 'age' => 28],
            ],
        ];
    }

    private function getRoomAvailabilityData(): array
    {
        return [
            'rooms' => [
                ['name' => 'Vergaderzaal A', 'status' => 'available', 'next_booking' => '14:00'],
                ['name' => 'Vergaderzaal B', 'status' => 'occupied', 'available_at' => '11:30'],
                ['name' => 'Vergaderzaal C', 'status' => 'available', 'next_booking' => '16:00'],
                ['name' => 'Boardroom', 'status' => 'occupied', 'available_at' => '15:00'],
            ],
        ];
    }

    private function getClockWeatherData(): array
    {
        return [
            'time' => now()->format('H:i:s'),
            'date' => now()->format('l, j F Y'),
            'weather' => [
                'temperature' => rand(15, 25),
                'condition' => collect(['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'])->random(),
                'icon' => '☀️',
            ],
        ];
    }

    private function getAnnouncementsData(): array
    {
        return [
            'announcements' => [
                ['title' => 'Team Lunch', 'message' => 'Don\'t forget the team lunch at 12:30 today!', 'priority' => 'high'],
                ['title' => 'System Maintenance', 'message' => 'Planned maintenance tonight from 22:00-23:00', 'priority' => 'medium'],
                ['title' => 'New Coffee Machine', 'message' => 'Check out the new coffee machine in the break room!', 'priority' => 'low'],
            ],
        ];
    }

    private function getTogglTimeTrackingData(): array
    {
        $service = new TogglTimeTrackingService();
        return $service->getCurrentWeekReport();
    }
}
