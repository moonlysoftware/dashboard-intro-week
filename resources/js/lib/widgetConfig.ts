import type { GridSize } from "@/Components/Screens/GridSizeSelector";

// Widget type to module path mapping
const widgetModules: Record<string, () => Promise<any>> = {
    birthday: () => import("@/Components/Widgets/BirthdayWidget"),
    room_availability: () =>
        import("@/Components/Widgets/RoomAvailabilityWidget"),
    clock_weather: () => import("@/Components/Widgets/ClockWeatherWidget"),
    announcements: () => import("@/Components/Widgets/AnnouncementsWidget"),
    toggl_time_tracking: () =>
        import("@/Components/Widgets/TogglTimeTrackingWidget"),
    image_widget: () => import("@/Components/Widgets/ImageWidget"),
};

const DEFAULT_SIZES: GridSize[] = [
    { cols: 2, rows: 1 },
    { cols: 2, rows: 2 },
    { cols: 2, rows: 5 },
];

export async function getWidgetSupportedSizes(
    widgetType: string,
): Promise<GridSize[]> {
    const moduleLoader = widgetModules[widgetType];

    if (!moduleLoader) {
        return DEFAULT_SIZES;
    }

    try {
        const module = await moduleLoader();
        return module.supportedGridSizes || DEFAULT_SIZES;
    } catch (error) {
        console.error(`Failed to load widget config for ${widgetType}:`, error);
        return DEFAULT_SIZES;
    }
}

// Synchronous version using cached data - to be populated at app initialization
const cachedWidgetSizes = new Map<string, GridSize[]>();

export function getWidgetSupportedSizesCached(widgetType: string): GridSize[] {
    return cachedWidgetSizes.get(widgetType) || DEFAULT_SIZES;
}

export function setWidgetSupportedSizes(
    widgetType: string,
    sizes: GridSize[],
): void {
    cachedWidgetSizes.set(widgetType, sizes);
}

export function initializeWidgetSizes(): void {
    // Initialize all widget sizes
    Object.entries(widgetModules).forEach(([widgetType, moduleLoader]) => {
        moduleLoader()
            .then((module) => {
                if (module.supportedGridSizes) {
                    setWidgetSupportedSizes(
                        widgetType,
                        module.supportedGridSizes,
                    );
                }
            })
            .catch((error) => {
                console.error(
                    `Failed to load widget config for ${widgetType}:`,
                    error,
                );
            });
    });
}
