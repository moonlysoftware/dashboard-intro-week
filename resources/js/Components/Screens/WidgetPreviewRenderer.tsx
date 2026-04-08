import BirthdayWidget from "@/Components/Widgets/BirthdayWidget";
import RoomAvailabilityWidget from "@/Components/Widgets/RoomAvailabilityWidget";
import ClockWeatherWidget from "@/Components/Widgets/ClockWeatherWidget";
import AnnouncementsWidget from "@/Components/Widgets/AnnouncementsWidget";
import TogglTimeTrackingWidget from "@/Components/Widgets/TogglTimeTrackingWidget";
import ImageWidget from "@/Components/Widgets/ImageWidget";
import WidgetNotConfigured from "@/Components/Widgets/WidgetNotConfigured";

interface WidgetData {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
    grid_row?: number;
    grid_col?: number;
    data?: any;
}

interface WidgetPreviewRendererProps {
    widget: WidgetData;
    isPreview?: boolean;
}

export function WidgetPreviewRenderer({
    widget,
    isPreview = true,
}: WidgetPreviewRendererProps) {
    const config = widget.config || {};
    const data = widget.data || {};

    // Check if widget is configured
    const isConfigured = {
        birthday: true, // Always has data
        room_availability: config.rooms && config.rooms.length > 0,
        clock_weather: true, // Always has data
        announcements: config.announcements && config.announcements.length > 0,
        toggl_time_tracking: true, // Always has data
        image_widget:
            config.selected_images && config.selected_images.length > 0,
    };

    const widgetIsConfigured =
        isConfigured[widget.widget_type as keyof typeof isConfigured] !== false;

    if (!widgetIsConfigured && isPreview) {
        return <WidgetNotConfigured />;
    }

    const widgetProps = { config, data };

    switch (widget.widget_type) {
        case "birthday":
            return <BirthdayWidget {...widgetProps} birthdayIndex={0} />;
        case "room_availability":
            return <RoomAvailabilityWidget {...widgetProps} />;
        case "clock_weather":
            return <ClockWeatherWidget {...widgetProps} />;
        case "announcements":
            return <AnnouncementsWidget {...widgetProps} />;
        case "toggl_time_tracking":
            return <TogglTimeTrackingWidget {...widgetProps} />;
        case "image_widget":
            return <ImageWidget {...widgetProps} />;
        default:
            return <WidgetNotConfigured />;
    }
}
