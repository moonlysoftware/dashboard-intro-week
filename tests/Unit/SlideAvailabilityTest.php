<?php

use App\Support\SlideAvailability;
use Carbon\Carbon;

test('slide is visible on its until date', function () {
    expect(SlideAvailability::isWithinAvailableUntil('2026-06-25', '2026-06-25'))->toBeTrue();
});

test('slide expires the day after its until date', function () {
    expect(SlideAvailability::isWithinAvailableUntil('2026-06-25', '2026-06-26'))->toBeFalse();
});

test('expired slides are removed from display widgets', function () {
    Carbon::setTestNow(Carbon::parse('2026-06-26 14:00:00', 'Europe/Amsterdam'));

    $widgets = collect([
        (object) [
            'widget_type' => 'announcement',
            'config' => ['_enabled' => true, '_availableUntil' => '2026-06-25'],
        ],
        (object) [
            'widget_type' => 'agenda',
            'config' => ['_enabled' => true],
        ],
    ]);

    $filtered = SlideAvailability::filterWidgetsForDisplay($widgets);

    expect($filtered)->toHaveCount(1);
    expect($filtered->first()->widget_type)->toBe('agenda');
});

test('disabled slides are removed from display widgets', function () {
    $widgets = collect([
        (object) [
            'widget_type' => 'announcement',
            'config' => ['_enabled' => false, '_availableUntil' => '2099-01-01'],
        ],
    ]);

    expect(SlideAvailability::filterWidgetsForDisplay($widgets))->toHaveCount(0);
});
