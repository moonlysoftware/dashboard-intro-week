import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BirthdayWidget from '@/Components/Widgets/BirthdayWidget';
import RoomAvailabilityWidget from '@/Components/Widgets/RoomAvailabilityWidget';
import ClockWeatherWidget from '@/Components/Widgets/ClockWeatherWidget';
import AnnouncementsWidget from '@/Components/Widgets/AnnouncementsWidget';
import TogglTimeTrackingWidget from '@/Components/Widgets/TogglTimeTrackingWidget';
import ImageWidget from '@/Components/Widgets/ImageWidget';

interface Widget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
    data: any;
}

type BentoLayout = 'bento_start_small' | 'bento_start_large';
type ViewMode = 'grid' | 'single_widget';

interface GridPosition {
    column: string; // e.g. "1 / 4"
    row: number;    // 1 or 2
}

function getGridPosition(gridOrder: number, layout: BentoLayout): GridPosition {
    // Explicit column start/end + row so widgets land on the right spot
    // regardless of how many widgets are actually present.
    //
    // bento_start_small: row1=[3,9], row2=[9,3]
    //   order 0 → col 1–4,  row 1
    //   order 1 → col 4–13, row 1
    //   order 2 → col 1–10, row 2
    //   order 3 → col 10–13, row 2
    //
    // bento_start_large: row1=[9,3], row2=[3,9]
    //   order 0 → col 1–10, row 1
    //   order 1 → col 10–13, row 1
    //   order 2 → col 1–4,  row 2
    //   order 3 → col 4–13, row 2
    const positions: Record<BentoLayout, GridPosition[]> = {
        bento_start_small: [
            { column: '1 / 4',   row: 1 },
            { column: '4 / 13',  row: 1 },
            { column: '1 / 10',  row: 2 },
            { column: '10 / 13', row: 2 },
        ],
        bento_start_large: [
            { column: '1 / 10',  row: 1 },
            { column: '10 / 13', row: 1 },
            { column: '1 / 4',   row: 2 },
            { column: '4 / 13',  row: 2 },
        ],
    };
    return positions[layout][gridOrder] ?? { column: '1 / 7', row: 1 };
}

interface Screen {
    id: number;
    name: string;
    refresh_interval: number;
    layout: BentoLayout;
    view_mode: ViewMode;
    featured_widget_id: number | null;
    widgets: Widget[];
}

interface DisplayShowProps {
    screen: Screen;
}

export default function Show({ screen: initialScreen }: DisplayShowProps) {
    const [widgets, setWidgets] = useState<Widget[]>(initialScreen.widgets || []);
    const [refreshInterval, setRefreshInterval] = useState(initialScreen.refresh_interval);
    const [layout, setLayout] = useState<BentoLayout>(initialScreen.layout ?? 'bento_start_small');
    const [viewMode, setViewMode] = useState<ViewMode>(initialScreen.view_mode ?? 'grid');
    const [featuredWidgetId, setFeaturedWidgetId] = useState<number | null>(initialScreen.featured_widget_id ?? null);

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
            const response = await axios.get(route('display.data', initialScreen.id));
            setWidgets(response.data.widgets);
            setRefreshInterval(response.data.refresh_interval);
            if (response.data.layout) setLayout(response.data.layout);
            if (response.data.view_mode) setViewMode(response.data.view_mode);
            setFeaturedWidgetId(response.data.featured_widget_id ?? null);
        } catch (error) {
            console.error('Error fetching widget data:', error);
        }
    };

    const renderWidget = (widget: Widget) => {
        const { column, row } = getGridPosition(widget.grid_order, layout);

        const widgetProps = {
            config: widget.config || {},
            data: widget.data || {},
        };

        const wrapWidget = (content: React.ReactNode) => (
            <div
                key={widget.id}
                style={{ gridColumn: column, gridRow: row }}
                className="min-h-0 h-full"
            >
                {content}
            </div>
        );

        switch (widget.widget_type) {
            case 'birthday': {
                const birthdayIndex = widgets
                    .filter(w => w.widget_type === 'birthday')
                    .sort((a, b) => a.grid_order - b.grid_order)
                    .findIndex(w => w.id === widget.id);
                return wrapWidget(
                    <BirthdayWidget {...widgetProps} birthdayIndex={birthdayIndex} />
                );
            }
            case 'room_availability':
                return wrapWidget(<RoomAvailabilityWidget {...widgetProps} />);
            case 'clock_weather':
                return wrapWidget(<ClockWeatherWidget {...widgetProps} />);
            case 'announcements':
                return wrapWidget(<AnnouncementsWidget {...widgetProps} />);
            case 'toggl_time_tracking':
                return wrapWidget(<TogglTimeTrackingWidget {...widgetProps} />);
            case 'image_widget':
                return wrapWidget(<ImageWidget {...widgetProps} />);
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={`Display: ${initialScreen.name}`} />

            <div className="h-screen flex flex-col bg-gradient-to-br from-background via-secondary/20 to-background p-6">
                {viewMode === 'single_widget' ? (
                    <div className="flex-1 min-h-0">
                        {(() => {
                            const featuredWidget = widgets.find((w) => w.id === featuredWidgetId);
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
                                case 'birthday': {
                                    const birthdayIndex = widgets
                                        .filter(w => w.widget_type === 'birthday')
                                        .sort((a, b) => a.grid_order - b.grid_order)
                                        .findIndex(w => w.id === featuredWidget.id);
                                    return <div className="h-full"><BirthdayWidget {...widgetProps} birthdayIndex={birthdayIndex} /></div>;
                                }
                                case 'room_availability':
                                    return <div className="h-full"><RoomAvailabilityWidget {...widgetProps} /></div>;
                                case 'clock_weather':
                                    return <div className="h-full"><ClockWeatherWidget {...widgetProps} /></div>;
                                case 'announcements':
                                    return <div className="h-full"><AnnouncementsWidget {...widgetProps} /></div>;
                                case 'toggl_time_tracking':
                                    return <div className="h-full"><TogglTimeTrackingWidget {...widgetProps} /></div>;
                                case 'image_widget':
                                    return <div className="h-full"><ImageWidget {...widgetProps} /></div>;
                                default:
                                    return null;
                            }
                        })()}
                    </div>
                ) : (
                    /* Widgets Grid — always 2 rows, fills remaining height */
                    <div className="grid grid-cols-12 grid-rows-2 gap-4 flex-1 min-h-0">
                        {widgets.length === 0 ? (
                            <div className="col-span-12 row-span-2 flex items-center justify-center">
                                <p className="text-muted-foreground text-2xl">
                                    No widgets configured for this screen
                                </p>
                            </div>
                        ) : (
                             widgets.filter((w) => w.id !== featuredWidgetId).map(renderWidget)
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
