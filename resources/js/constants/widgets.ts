export type BentoLayout = 'bento_start_small' | 'bento_start_large';
export type ViewMode = 'grid' | 'single_widget';

/**
 * Widget types that require a 3/4-wide (large) slot.
 * They cannot be placed in a 1/4-wide (small) slot.
 */
export const WIDE_ONLY_WIDGETS = new Set<string>([
    'toggl_time_tracking',
    'room_availability',
    'announcements',
]);

export function isWideOnlyWidget(widgetType: string): boolean {
    return WIDE_ONLY_WIDGETS.has(widgetType);
}

/**
 * Widget types that require a 1/4-wide (small) slot.
 * They cannot be placed in a 3/4-wide (large) slot.
 */
export const SMALL_ONLY_WIDGETS = new Set<string>([
    'birthday',
]);

export function isSmallOnlyWidget(widgetType: string): boolean {
    return SMALL_ONLY_WIDGETS.has(widgetType);
}

/**
 * Returns true if the given slot index is a small (1/4 width) slot
 * for the provided bento layout.
 *
 * bento_start_small: slots 0 and 3 are small
 * bento_start_large: slots 1 and 2 are small
 */
const SMALL_SLOTS: Record<BentoLayout, number[]> = {
    bento_start_small: [0, 3],
    bento_start_large: [1, 2],
};

export function isSmallSlot(slotIndex: number, layout: BentoLayout): boolean {
    return SMALL_SLOTS[layout]?.includes(slotIndex) ?? false;
}
