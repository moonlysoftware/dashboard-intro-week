import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { isWideOnlyWidget, isSmallOnlyWidget } from '@/constants/widgets';

const WIDGET_COVER_IMAGES: Record<string, string> = {
    birthday: '/storage/widgetsCoverImages/verjaardagen.png',
    room_availability: '/storage/widgetsCoverImages/ruimte-beschikbaarheid.png',
    clock_weather: '/storage/widgetsCoverImages/klok-datum-weer.png',
    announcements: '/storage/widgetsCoverImages/mededelingen.png',
    toggl_time_tracking: '/storage/widgetsCoverImages/toggl-uren-tracking.png',
    image_widget: '/storage/widgetsCoverImages/afbeelding-slideshow.png',
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

    const coverImage = WIDGET_COVER_IMAGES[widgetType];
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
            <div className="relative overflow-hidden h-28 bg-muted/30" style={{ pointerEvents: 'none' }}>
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={label}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No preview</span>
                    </div>
                )}

                {isWide && (
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold leading-none px-1.5 py-0.5 rounded bg-amber-500/90 text-white pointer-events-none select-none">
                        Wide
                    </span>
                )}
                {isSmall && (
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold leading-none px-1.5 py-0.5 rounded bg-blue-500/90 text-white pointer-events-none select-none">
                        Small
                    </span>
                )}
            </div>

            <div className="px-3 py-2">
                <span className="font-archia text-sm font-medium leading-tight line-clamp-1">{label}</span>
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
                Drag a widget to a slot on the canvas
            </p>
            <div className="grid grid-cols-2 gap-3">
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
