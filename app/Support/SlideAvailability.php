<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;

class SlideAvailability
{
    private const TIMEZONE = 'Europe/Amsterdam';

    /** @var list<string> */
    private const SLIDE_TYPES = [
        'agenda',
        'birthdays',
        'birthday',
        'appreciation',
        'announcement',
        'announcements',
    ];

    public static function localDateString(?Carbon $date = null): string
    {
        return ($date ?? Carbon::now(self::TIMEZONE))->toDateString();
    }

    public static function isWithinAvailableUntil(?string $until, ?string $today = null): bool
    {
        if ($until === null || $until === '') {
            return true;
        }

        $today ??= self::localDateString();

        return $today <= $until;
    }

    public static function isExpired(?array $config): bool
    {
        $until = $config['_availableUntil'] ?? null;

        if ($until === null || $until === '') {
            return false;
        }

        return ! self::isWithinAvailableUntil($until);
    }

    public static function shouldShowOnDisplay(?array $config): bool
    {
        $config ??= [];

        if (($config['_enabled'] ?? true) === false) {
            return false;
        }

        return self::isWithinAvailableUntil($config['_availableUntil'] ?? null);
    }

    public static function isSlideType(string $widgetType): bool
    {
        return in_array($widgetType, self::SLIDE_TYPES, true);
    }

    public static function filterWidgetsForDisplay(Collection $widgets): Collection
    {
        return $widgets
            ->filter(function ($widget) {
                if (! self::isSlideType($widget->widget_type)) {
                    return true;
                }

                return self::shouldShowOnDisplay($widget->config);
            })
            ->values();
    }
}
