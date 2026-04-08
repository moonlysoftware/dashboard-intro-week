import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import axios from "axios";
import BirthdayWidget from "@/Components/Widgets/BirthdayWidget";
import RoomAvailabilityWidget from "@/Components/Widgets/RoomAvailabilityWidget";
import ClockWeatherWidget from "@/Components/Widgets/ClockWeatherWidget";
import AnnouncementsWidget from "@/Components/Widgets/AnnouncementsWidget";
import TogglTimeTrackingWidget from "@/Components/Widgets/TogglTimeTrackingWidget";
import ImageWidget from "@/Components/Widgets/ImageWidget";

interface Widget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
    grid_row: number;
    grid_col: number;
    data: any;
}

type ViewMode = "grid" | "single_widget";

const GRID_COLS = 6;
const GRID_ROWS = 5;

interface Screen {
    id: number;
    name: string;
    refresh_interval: number;
    view_mode: ViewMode;
    featured_widget_id: number | null;
    widgets: Widget[];
}

interface DisplayShowProps {
    screen: Screen;
}

export default function Show({ screen: initialScreen }: DisplayShowProps) {
    const [widgets, setWidgets] = useState<Widget[]>(
        initialScreen.widgets || [],
    );
    const [refreshInterval, setRefreshInterval] = useState(
        initialScreen.refresh_interval,
    );
    const [viewMode, setViewMode] = useState<ViewMode>(
        initialScreen.view_mode ?? "grid",
    );
    const [featuredWidgetId, setFeaturedWidgetId] = useState<number | null>(
        initialScreen.featured_widget_id ?? null,
    );

    useEffect(() => {
        // Fetch widget data immediately
        fetchWidgetData();

        // Set up polling interval
        const interval = setInterval(() => {
            fetchWidgetData();
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    const fetchWidgetData = async () => {
        try {
            const response = await axios.get(
                route("display.data", initialScreen.id),
            );
            setWidgets(response.data.widgets);
            setRefreshInterval(response.data.refresh_interval);
            if (response.data.view_mode) setViewMode(response.data.view_mode);
            setFeaturedWidgetId(response.data.featured_widget_id ?? null);
        } catch (error) {
            console.error("Error fetching widget data:", error);
        }
    };

    // Calculate actual grid positions
    const grid: boolean[][] = Array(GRID_ROWS)
        .fill(null)
        .map(() => Array(GRID_COLS).fill(false));

    const widgetPositions = new Map<number, { row: number; col: number }>();

    const sortedWidgets = [...widgets].sort(
        (a, b) => a.grid_order - b.grid_order,
    );

    sortedWidgets.forEach((widget) => {
        let row = widget.grid_row ?? -1;
        let col = widget.grid_col ?? -1;
        let placed = false;

        if (row >= 0 && col >= 0) {
            if (
                col + widget.grid_col_span <= GRID_COLS &&
                row + widget.grid_row_span <= GRID_ROWS
            ) {
                let canPlace = true;
                for (let r = row; r < row + widget.grid_row_span; r++) {
                    for (let c = col; c < col + widget.grid_col_span; c++) {
                        if (grid[r][c]) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }

                if (canPlace) {
                    for (let r = row; r < row + widget.grid_row_span; r++) {
                        for (let c = col; c < col + widget.grid_col_span; c++) {
                            grid[r][c] = true;
                        }
                    }
                    widgetPositions.set(widget.id, { row, col });
                    placed = true;
                }
            }
        }

        if (!placed) {
            for (let r = 0; r < GRID_ROWS && !placed; r++) {
                for (let c = 0; c < GRID_COLS && !placed; c++) {
                    if (
                        c + widget.grid_col_span <= GRID_COLS &&
                        r + widget.grid_row_span <= GRID_ROWS
                    ) {
                        let canPlace = true;
                        for (let rr = r; rr < r + widget.grid_row_span; rr++) {
                            for (
                                let cc = c;
                                cc < c + widget.grid_col_span;
                                cc++
                            ) {
                                if (grid[rr][cc]) {
                                    canPlace = false;
                                    break;
                                }
                            }
                            if (!canPlace) break;
                        }

                        if (canPlace) {
                            for (
                                let rr = r;
                                rr < r + widget.grid_row_span;
                                rr++
                            ) {
                                for (
                                    let cc = c;
                                    cc < c + widget.grid_col_span;
                                    cc++
                                ) {
                                    grid[rr][cc] = true;
                                }
                            }
                            widgetPositions.set(widget.id, { row: r, col: c });
                            placed = true;
                        }
                    }
                }
            }
        }
    });

    const renderWidget = (widget: Widget) => {
        const pos = widgetPositions.get(widget.id);
        if (!pos) return null; // If it couldn't be placed, don't render it

        const widgetProps = {
            config: widget.config || {},
            data: widget.data || {},
        };

        const col = pos.col + 1;
        const row = pos.row + 1;

        const wrapWidget = (content: React.ReactNode) => (
            <div
                key={widget.id}
                style={{
                    gridColumn: `${col} / span ${Math.min(widget.grid_col_span, GRID_COLS - col + 1)}`,
                    gridRow: `${row} / span ${Math.min(widget.grid_row_span, GRID_ROWS - row + 1)}`,
                }}
                className="min-h-0 h-full"
            >
                {content}
            </div>
        );

        switch (widget.widget_type) {
            case "birthday": {
                const birthdayIndex = widgets
                    .filter((w) => w.widget_type === "birthday")
                    .sort((a, b) => a.grid_order - b.grid_order)
                    .findIndex((w) => w.id === widget.id);
                return wrapWidget(
                    <BirthdayWidget
                        {...widgetProps}
                        birthdayIndex={birthdayIndex}
                    />,
                );
            }
            case "room_availability":
                return wrapWidget(<RoomAvailabilityWidget {...widgetProps} />);
            case "clock_weather":
                return wrapWidget(<ClockWeatherWidget {...widgetProps} />);
            case "announcements":
                return wrapWidget(<AnnouncementsWidget {...widgetProps} />);
            case "toggl_time_tracking":
                return wrapWidget(<TogglTimeTrackingWidget {...widgetProps} />);
            case "image_widget":
                return wrapWidget(<ImageWidget {...widgetProps} />);
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={`Display: ${initialScreen.name}`} />

            <div
                className="h-screen flex flex-col bg-gradient-to-br from-background via-secondary/20 to-background"
                style={{ padding: "clamp(1rem, 1vw, 2rem)" }}
            >
                {viewMode === "single_widget" ? (
                    <div className="flex-1 min-h-0">
                        {(() => {
                            const featuredWidget = widgets.find(
                                (w) => w.id === featuredWidgetId,
                            );
                            if (!featuredWidget) {
                                return (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-muted-foreground text-2xl">
                                            No widget selected
                                        </p>
                                    </div>
                                );
                            }

                            const widgetProps = {
                                config: featuredWidget.config || {},
                                data: featuredWidget.data || {},
                            };

                            switch (featuredWidget.widget_type) {
                                case "birthday": {
                                    const birthdayIndex = widgets
                                        .filter(
                                            (w) => w.widget_type === "birthday",
                                        )
                                        .sort(
                                            (a, b) =>
                                                a.grid_order - b.grid_order,
                                        )
                                        .findIndex(
                                            (w) => w.id === featuredWidget.id,
                                        );
                                    return (
                                        <div className="h-full">
                                            <BirthdayWidget
                                                {...widgetProps}
                                                birthdayIndex={birthdayIndex}
                                            />
                                        </div>
                                    );
                                }
                                case "room_availability":
                                    return (
                                        <div className="h-full">
                                            <RoomAvailabilityWidget
                                                {...widgetProps}
                                            />
                                        </div>
                                    );
                                case "clock_weather":
                                    return (
                                        <div className="h-full">
                                            <ClockWeatherWidget
                                                {...widgetProps}
                                            />
                                        </div>
                                    );
                                case "announcements":
                                    return (
                                        <div className="h-full">
                                            <AnnouncementsWidget
                                                {...widgetProps}
                                            />
                                        </div>
                                    );
                                case "toggl_time_tracking":
                                    return (
                                        <div className="h-full">
                                            <TogglTimeTrackingWidget
                                                {...widgetProps}
                                            />
                                        </div>
                                    );
                                case "image_widget":
                                    return (
                                        <div className="h-full">
                                            <ImageWidget {...widgetProps} />
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })()}
                    </div>
                ) : (
                    /* Widgets Grid — 6 columns × 5 rows */
                    <div
                        className="grid gap-3 flex-1 min-h-0"
                        style={{
                            gridTemplateColumns: `repeat(6, 1fr)`,
                            gridAutoRows: `minmax(120px, auto)`,
                        }}
                    >
                        {widgets.length === 0 ? (
                            <div className="col-span-6 row-span-5 flex items-center justify-center">
                                <p className="text-muted-foreground text-2xl">
                                    No widgets configured for this screen
                                </p>
                            </div>
                        ) : (
                            widgets
                                .filter((w) => w.id !== featuredWidgetId)
                                .map(renderWidget)
                        )}
                    </div>
                )}

                {/* Footer with last update time */}
                <div className="fixed bottom-4 right-4 text-muted-foreground text-sm">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </>
    );
}
