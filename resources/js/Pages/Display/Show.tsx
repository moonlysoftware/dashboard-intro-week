import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BirthdayWidget from '@/Components/Widgets/BirthdayWidget';
import RoomAvailabilityWidget from '@/Components/Widgets/RoomAvailabilityWidget';
import ClockWeatherWidget from '@/Components/Widgets/ClockWeatherWidget';
import AnnouncementsWidget from '@/Components/Widgets/AnnouncementsWidget';
import TogglTimeTrackingWidget from '@/Components/Widgets/TogglTimeTrackingWidget';

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

function getColSpan(gridOrder: number, layout: BentoLayout): number {
    // Row 1 and row 2 are always opposite to each other
    // bento_start_small: [3, 9, 9, 3]
    // bento_start_large: [9, 3, 3, 9]
    const spans: Record<BentoLayout, [number, number, number, number]> = {
        bento_start_small: [3, 9, 9, 3],
        bento_start_large: [9, 3, 3, 9],
    };
    return spans[layout][gridOrder] ?? 6;
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
        const colSpan = getColSpan(widget.grid_order, layout);

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
            default:
                return null;
        }

        return (
            <div
                key={widget.id}
                style={{ gridColumn: `span ${colSpan}` }}
            >
                <WidgetComponent {...widgetProps} />
            </div>
        );
    };

    return (
        <>
            <Head title={`Display: ${initialScreen.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-6">
                {/* Screen Title */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-foreground">
                        {initialScreen.name}
                    </h1>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-12 gap-4 auto-rows-fr">
                    {widgets.length === 0 ? (
                        <div className="col-span-12 flex items-center justify-center h-96">
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
