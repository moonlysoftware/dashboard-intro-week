import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import BirthdayWidget from '@/Components/Widgets/BirthdayWidget';
import RoomAvailabilityWidget from '@/Components/Widgets/RoomAvailabilityWidget';
import ClockWeatherWidget from '@/Components/Widgets/ClockWeatherWidget';
import AnnouncementsWidget from '@/Components/Widgets/AnnouncementsWidget';
import TogglTimeTrackingWidget from '@/Components/Widgets/TogglTimeTrackingWidget';
import ImageWidget from '@/Components/Widgets/ImageWidget';
import { isWideOnlyWidget, isSmallOnlyWidget } from '@/constants/widgets';
import type { ComponentType } from 'react';

const WIDGET_PREVIEWS: Record<string, ComponentType<{ config: Record<string, any>; data: Record<string, any> }>> = {
    birthday: BirthdayWidget,
    room_availability: RoomAvailabilityWidget,
    clock_weather: ClockWeatherWidget,
    announcements: AnnouncementsWidget,
    toggl_time_tracking: TogglTimeTrackingWidget,
    image_widget: ImageWidget,
};

const WIDGET_PREVIEW_DATA: Record<string, { config: Record<string, any>; data: Record<string, any> }> = {
    announcements: {
        config: {},
        data: {
            announcements: [
                { title: 'Team Lunch', message: 'Vergeet de teamlunch niet om 12:30!', priority: 'high' },
                { title: 'Onderhoud', message: 'Gepland onderhoud vanavond 22:00-23:00', priority: 'medium' },
                { title: 'Koffiemachine', message: 'Nieuwe koffiemachine in de kantine!', priority: 'low' },
            ],
        },
    },
    toggl_time_tracking: {
        config: {},
        data: {
            week_number: 7,
            year: 2026,
            total_users: 10,
            users_complete: 7,
            users_incomplete: 3,
            percentage_complete: 70,
            missing_hours_users: [
                { name: 'Jan Jansen', hours_missing: '05:30:00', hours_clocked: '31:30:00', percentage: 85 },
                { name: 'Piet Pietersen', hours_missing: '12:00:00', hours_clocked: '25:00:00', percentage: 68 },
                { name: 'Klaas de Vries', hours_missing: '20:00:00', hours_clocked: '17:00:00', percentage: 46 },
            ],
        },
    },
    image_widget: {
        config: {
            selected_images: ['/storage/weather/weather.png'],
        },
        data: {},
    },
};

interface DraggableWidgetTileProps {
    widgetType: string;
    label: string;
    onWidgetTypeClick?: (widgetType: string) => void;
}

function DraggableWidgetTile({ widgetType, label, onWidgetTypeClick }: DraggableWidgetTileProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `widget-type-${widgetType}`,
        data: { widgetType },
    });

    const PreviewComponent = WIDGET_PREVIEWS[widgetType];
    const isWide = isWideOnlyWidget(widgetType);
    const isSmall = isSmallOnlyWidget(widgetType);

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onWidgetTypeClick?.(widgetType)}
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
                        <PreviewComponent
                            config={WIDGET_PREVIEW_DATA[widgetType]?.config ?? {}}
                            data={WIDGET_PREVIEW_DATA[widgetType]?.data ?? {}}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Geen preview</span>
                    </div>
                )}

                {isWide && (
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold leading-none px-1.5 py-0.5 rounded bg-amber-500/90 text-white pointer-events-none select-none">
                        Breed
                    </span>
                )}
                {isSmall && (
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold leading-none px-1.5 py-0.5 rounded bg-blue-500/90 text-white pointer-events-none select-none">
                        Klein
                    </span>
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
    onWidgetTypeClick?: (widgetType: string) => void;
}

export function WidgetLibraryPanel({ widgetTypes, onWidgetTypeClick }: WidgetLibraryPanelProps) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-3">
                Sleep een widget naar een plek in een scherm
            </p>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(widgetTypes).map(([key, label]) => (
                    <DraggableWidgetTile
                        key={key}
                        widgetType={key}
                        label={label}
                        onWidgetTypeClick={onWidgetTypeClick}
                    />
                ))}
            </div>
        </div>
    );
}
