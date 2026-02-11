import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import BirthdayWidget from '@/Components/Widgets/BirthdayWidget';
import RoomAvailabilityWidget from '@/Components/Widgets/RoomAvailabilityWidget';
import ClockWeatherWidget from '@/Components/Widgets/ClockWeatherWidget';
import AnnouncementsWidget from '@/Components/Widgets/AnnouncementsWidget';
import TogglTimeTrackingWidget from '@/Components/Widgets/TogglTimeTrackingWidget';
import type { ComponentType } from 'react';

const WIDGET_PREVIEWS: Record<string, ComponentType<{ config: Record<string, any>; data: Record<string, any> }>> = {
    birthday: BirthdayWidget,
    room_availability: RoomAvailabilityWidget,
    clock_weather: ClockWeatherWidget,
    announcements: AnnouncementsWidget,
    toggl_time_tracking: TogglTimeTrackingWidget,
};

interface DraggableWidgetTileProps {
    widgetType: string;
    label: string;
}

function DraggableWidgetTile({ widgetType, label }: DraggableWidgetTileProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `widget-type-${widgetType}`,
        data: { widgetType },
    });

    const PreviewComponent = WIDGET_PREVIEWS[widgetType];

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                flex flex-col rounded-lg border cursor-grab active:cursor-grabbing
                bg-card hover:bg-accent transition-colors select-none overflow-hidden
                ${isDragging ? 'opacity-40 shadow-lg' : ''}
            `}
        >
            {/* Scaled widget preview — pointer-events disabled on container + all descendants */}
            <div className="relative overflow-hidden h-32 bg-muted/30 [&_*]:pointer-events-none" style={{ pointerEvents: 'none' }}>
                {PreviewComponent ? (
                    <div
                        style={{
                            transform: 'scale(0.28)',
                            transformOrigin: 'top left',
                            width: '357%',
                            height: '357%',
                        }}
                    >
                        <PreviewComponent config={{}} data={{}} />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Geen preview</span>
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="px-2 py-1.5">
                <span className="text-xs font-medium leading-tight line-clamp-1">{label}</span>
            </div>
        </div>
    );
}

interface WidgetLibraryPanelProps {
    widgetTypes: Record<string, string>;
}

export function WidgetLibraryPanel({ widgetTypes }: WidgetLibraryPanelProps) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-3">
                Sleep een widget naar een plek in een scherm
            </p>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(widgetTypes).map(([key, label]) => (
                    <DraggableWidgetTile key={key} widgetType={key} label={label} />
                ))}
            </div>
        </div>
    );
}
