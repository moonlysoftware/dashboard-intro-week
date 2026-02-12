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
    widgets: Widget[];
}

interface DisplayShowProps {
    screen: Screen;
}

export default function Show({ screen: initialScreen }: DisplayShowProps) {
    const [widgets, setWidgets] = useState<Widget[]>(initialScreen.widgets || []);
    const [refreshInterval, setRefreshInterval] = useState(initialScreen.refresh_interval);
    const [layout, setLayout] = useState<BentoLayout>(initialScreen.layout ?? 'bento_start_small');

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

        let WidgetComponent;
        switch (widget.widget_type) {
            case 'birthday':
                WidgetComponent = BirthdayWidget;
                break;
            case 'room_availability':
                WidgetComponent = RoomAvailabilityWidget;
                break;
            case 'clock_weather':
                WidgetComponent = ClockWeatherWidget;
                break;
            case 'announcements':
                WidgetComponent = AnnouncementsWidget;
                break;
            case 'toggl_time_tracking':
                WidgetComponent = TogglTimeTrackingWidget;
                break;
            case 'image_widget':
                WidgetComponent = ImageWidget;
                break;
            default:
                return null;
        }

        return (
            <div
                key={widget.id}
                style={{ gridColumn: column, gridRow: row }}
                className="min-h-0 h-full"
            >
                <WidgetComponent {...widgetProps} />
            </div>
        );
    };

    return (
        <>
            <Head title={`Display: ${initialScreen.name}`} />

            <div className="h-screen flex flex-col bg-gradient-to-br from-background via-secondary/20 to-background p-6">
                {/* Widgets Grid — always 2 rows, fills remaining height */}
                <div className="grid grid-cols-12 grid-rows-2 gap-4 flex-1 min-h-0">
                    {widgets.length === 0 ? (
                        <div className="col-span-12 row-span-2 flex items-center justify-center">
                            <p className="text-muted-foreground text-2xl">
                                No widgets configured for this screen
                            </p>
                        </div>
                    ) : (
                        widgets.map(renderWidget)
                    )}
                </div>

                {/* Footer with last update time */}
                <div className="fixed bottom-4 right-4 text-muted-foreground text-sm">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </>
    );
}
