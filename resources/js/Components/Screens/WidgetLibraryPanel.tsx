import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Cake, Building2, Clock, Bell, Timer } from 'lucide-react';
import type { ComponentType } from 'react';

const WIDGET_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    birthday: Cake,
    room_availability: Building2,
    clock_weather: Clock,
    announcements: Bell,
    toggl_time_tracking: Timer,
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

    const Icon = WIDGET_ICONS[widgetType] || Bell;

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
                flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing
                bg-card hover:bg-accent transition-colors select-none
                ${isDragging ? 'opacity-40 shadow-lg' : ''}
            `}
        >
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

interface WidgetLibraryPanelProps {
    widgetTypes: Record<string, string>;
}

export function WidgetLibraryPanel({ widgetTypes }: WidgetLibraryPanelProps) {
    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
                Sleep een widget naar een plek in een scherm
            </p>
            {Object.entries(widgetTypes).map(([key, label]) => (
                <DraggableWidgetTile key={key} widgetType={key} label={label} />
            ))}
        </div>
    );
}
