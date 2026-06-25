<?php

use App\Services\RoomScheduleHelper;
use Carbon\Carbon;

function calendarEvent(string $start, string $end): array
{
    return [
        'start' => Carbon::parse($start, 'Europe/Amsterdam'),
        'end' => Carbon::parse($end, 'Europe/Amsterdam'),
    ];
}

test('extends through back-to-back meetings', function () {
    $events = [
        calendarEvent('2026-06-26 10:00', '2026-06-26 11:00'),
        calendarEvent('2026-06-26 11:00', '2026-06-26 12:00'),
        calendarEvent('2026-06-26 12:00', '2026-06-26 13:00'),
    ];

    $until = RoomScheduleHelper::extendBusyUntil(
        Carbon::parse('2026-06-26 11:00', 'Europe/Amsterdam'),
        $events,
    );

    expect($until->format('H:i'))->toBe('13:00');
});

test('extends through short gaps under fifteen minutes', function () {
    $events = [
        calendarEvent('2026-06-26 10:00', '2026-06-26 11:00'),
        calendarEvent('2026-06-26 11:06', '2026-06-26 12:00'),
    ];

    $until = RoomScheduleHelper::extendBusyUntil(
        Carbon::parse('2026-06-26 11:00', 'Europe/Amsterdam'),
        $events,
    );

    expect($until->format('H:i'))->toBe('12:00');
});

test('stops at gaps of fifteen minutes or more', function () {
    $events = [
        calendarEvent('2026-06-26 10:00', '2026-06-26 11:00'),
        calendarEvent('2026-06-26 11:20', '2026-06-26 12:00'),
    ];

    $until = RoomScheduleHelper::extendBusyUntil(
        Carbon::parse('2026-06-26 11:00', 'Europe/Amsterdam'),
        $events,
    );

    expect($until->format('H:i'))->toBe('11:00');
});

test('extends through overlapping meetings', function () {
    $events = [
        calendarEvent('2026-06-26 10:00', '2026-06-26 11:00'),
        calendarEvent('2026-06-26 10:30', '2026-06-26 11:30'),
    ];

    $until = RoomScheduleHelper::extendBusyUntil(
        Carbon::parse('2026-06-26 11:00', 'Europe/Amsterdam'),
        $events,
    );

    expect($until->format('H:i'))->toBe('11:30');
});
