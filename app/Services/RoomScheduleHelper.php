<?php

namespace App\Services;

use Carbon\Carbon;

class RoomScheduleHelper
{
    /**
     * Minimum free gap (minutes) before the next booking starts a new busy block.
     * Gaps shorter than this are treated as one continuous occupancy period.
     */
    public const MIN_FREE_GAP_MINUTES = 15;

    /**
     * @param  array<int, array{start: Carbon, end: Carbon, summary?: string}>  $events
     */
    public static function findCurrentEvent(Carbon $now, array $events): ?array
    {
        foreach ($events as $event) {
            if ($event['start']->lte($now) && $event['end']->gt($now)) {
                return $event;
            }
        }

        return null;
    }

    /**
     * @param  array<int, array{start: Carbon, end: Carbon, summary?: string}>  $events
     */
    public static function findNextEvent(Carbon $now, array $events): ?array
    {
        foreach ($events as $event) {
            if ($event['start']->gt($now)) {
                return $event;
            }
        }

        return null;
    }

    /**
     * Extend the end of a busy block through consecutive or overlapping bookings.
     *
     * @param  array<int, array{start: Carbon, end: Carbon, summary?: string}>  $events
     */
    public static function extendBusyUntil(
        Carbon $blockEnd,
        array $events,
        int $minFreeGapMinutes = self::MIN_FREE_GAP_MINUTES,
    ): Carbon {
        $end = $blockEnd->copy();

        while (true) {
            $next = self::findConsecutiveEvent($end, $events, $minFreeGapMinutes);

            if ($next === null || $next['end']->lte($end)) {
                break;
            }

            $end = $next['end']->copy();
        }

        return $end;
    }

    /**
     * @param  array<int, array{start: Carbon, end: Carbon, summary?: string}>  $events
     */
    private static function findConsecutiveEvent(
        Carbon $blockEnd,
        array $events,
        int $minFreeGapMinutes,
    ): ?array {
        $next = null;

        foreach ($events as $event) {
            if ($event['end']->lte($blockEnd)) {
                continue;
            }

            $isConsecutive = $event['start']->lt($blockEnd)
                || $blockEnd->diffInMinutes($event['start']) < $minFreeGapMinutes;

            if (! $isConsecutive) {
                continue;
            }

            if ($next === null || $event['start']->lt($next['start'])) {
                $next = $event;
            }
        }

        return $next;
    }
}
