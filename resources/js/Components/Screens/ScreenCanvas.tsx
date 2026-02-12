import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import {
    isWideOnlyWidget,
    isSmallOnlyWidget,
    isSmallSlot,
} from "@/constants/widgets";

export interface Widget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
}

const SLOT_COUNT = 4;

interface DraggableWidgetProps {
    widget: Widget;
    screenId: number;
    widgetTypes: Record<string, string>;
    isSelected: boolean;
    onWidgetClick: (widget: Widget) => void;
    onWidgetRemove: (widgetId: number) => void;
}

function DraggableWidget({
    widget,
    screenId,
    widgetTypes,
    isSelected,
    onWidgetClick,
    onWidgetRemove,
}: DraggableWidgetProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `existing-widget-${widget.id}`,
            data: {
                existingWidgetId: widget.id,
                currentOrder: widget.grid_order,
                screenId,
            },
        });

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`w-full h-full flex items-center justify-center relative px-2 ${isDragging ? "opacity-0" : ""}`}
        >
            <div
                className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors"
                {...listeners}
                {...attributes}
            >
                <GripVertical className="h-3 w-3" />
            </div>

            <span
                className="text-xs font-medium text-center leading-tight px-4 cursor-pointer"
                onClick={() => onWidgetClick(widget)}
            >
                {widgetTypes[widget.widget_type] ?? widget.widget_type}
            </span>

            <button
                className="absolute top-1 right-1 h-4 w-4 rounded-full bg-muted-foreground/20 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onWidgetRemove(widget.id);
                }}
            >
                <X className="h-2.5 w-2.5" />
            </button>
        </div>
    );
}

// ── Individual slot (droppable) ───────────────────────────────────────────────

interface CanvasSlotProps {
    slotId: string;
    screenId: number;
    widget?: Widget;
    widgetTypes: Record<string, string>;
    isScreenActive: boolean;
    isSelected: boolean;
    isBlocked: boolean;
    blockedLabel?: string;
    onWidgetClick: (widget: Widget) => void;
    onWidgetRemove: (widgetId: number) => void;
}

function CanvasSlot({
    slotId,
    screenId,
    widget,
    widgetTypes,
    isScreenActive,
    isSelected,
    isBlocked,
    blockedLabel = "Alleen breed",
    onWidgetClick,
    onWidgetRemove,
}: CanvasSlotProps) {
    const { isOver, setNodeRef } = useDroppable({ id: slotId });

    let borderClass = "";
    let bgClass = "";

    if (widget) {
        if (isSelected) {
            borderClass = "border-solid border-primary";
            bgClass = "bg-primary/10";
        } else if (isOver && !isBlocked) {
            borderClass = "border-solid border-primary/60";
            bgClass = "bg-primary/5";
        } else if (isOver && isBlocked) {
            borderClass = "border-solid border-destructive/60";
            bgClass = "bg-destructive/5";
        } else {
            borderClass = "border-solid border-border";
            bgClass = "bg-muted/40";
        }
    } else {
        // Empty slot
        if (isOver && isScreenActive && isBlocked) {
            borderClass = "border-dashed border-destructive";
            bgClass = "bg-destructive/5";
        } else if (isOver && isScreenActive) {
            borderClass = "border-dashed border-primary";
            bgClass = "bg-primary/5 scale-[1.02]";
        } else if (isBlocked && isScreenActive) {
            borderClass = "border-dashed border-destructive/30";
            bgClass = "";
        } else if (isScreenActive) {
            borderClass =
                "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50";
            bgClass = "";
        } else {
            borderClass = "border-dashed border-muted-foreground/12";
            bgClass = "";
        }
    }

    return (
        <div
            ref={setNodeRef}
            className={`relative rounded-lg border-2 h-16 flex items-center justify-center transition-all duration-150 overflow-hidden ${borderClass} ${bgClass}`}
        >
            {widget ? (
                <DraggableWidget
                    widget={widget}
                    screenId={screenId}
                    widgetTypes={widgetTypes}
                    isSelected={isSelected}
                    onWidgetClick={onWidgetClick}
                    onWidgetRemove={onWidgetRemove}
                />
            ) : (
                <span
                    className={`text-[10px] select-none transition-colors ${
                        isOver && isScreenActive && isBlocked
                            ? "text-destructive font-medium"
                            : isOver && isScreenActive
                              ? "text-primary font-medium"
                              : isBlocked && isScreenActive
                                ? "text-destructive/50"
                                : isScreenActive
                                  ? "text-muted-foreground/40"
                                  : "text-transparent"
                    }`}
                >
                    {isOver && isScreenActive && isBlocked
                        ? "Niet beschikbaar"
                        : isOver && isScreenActive
                          ? "Loslaten"
                          : isBlocked && isScreenActive
                            ? blockedLabel
                            : "Sleep hier"}
                </span>
            )}
        </div>
    );
}

// ── Canvas ────────────────────────────────────────────────────────────────────

type BentoLayout = "bento_start_small" | "bento_start_large";

export interface ScreenCanvasProps {
    screenId: number;
    widgets: Widget[];
    widgetTypes: Record<string, string>;
    isScreenActive: boolean;
    layout?: BentoLayout;
    activeDragWidgetType?: string | null;
    selectedWidgetId?: number | null;
    onWidgetClick: (widget: Widget) => void;
    onWidgetRemove: (widgetId: number) => void;
}

export function ScreenCanvas({
    screenId,
    widgets,
    widgetTypes,
    isScreenActive,
    layout = "bento_start_small",
    activeDragWidgetType,
    selectedWidgetId,
    onWidgetClick,
    onWidgetRemove,
}: ScreenCanvasProps) {
    const isDragWide = activeDragWidgetType
        ? isWideOnlyWidget(activeDragWidgetType)
        : false;
    const isDragSmallOnly = activeDragWidgetType
        ? isSmallOnlyWidget(activeDragWidgetType)
        : false;
    // Row 1 and row 2 are always opposite:
    // bento_start_small: [3, 9, 9, 3] (out of 12)
    // bento_start_large: [9, 3, 3, 9] (out of 12)
    const colSpans: Record<BentoLayout, [number, number, number, number]> = {
        bento_start_small: [3, 9, 9, 3],
        bento_start_large: [9, 3, 3, 9],
    };

    return (
        <div className="grid grid-cols-12 gap-2 mt-1">
            {Array.from({ length: SLOT_COUNT }, (_, i) => {
                const widget = widgets.find((w) => w.grid_order === i);
                const span = colSpans[layout][i];
                return (
                    <div key={i} style={{ gridColumn: `span ${span}` }}>
                        <CanvasSlot
                            slotId={`slot-${screenId}-${i}`}
                            screenId={screenId}
                            widget={widget}
                            widgetTypes={widgetTypes}
                            isScreenActive={isScreenActive}
                            isSelected={widget?.id === selectedWidgetId}
                            isBlocked={
                                (isDragWide && isSmallSlot(i, layout)) ||
                                (isDragSmallOnly && !isSmallSlot(i, layout))
                            }
                            blockedLabel={
                                isDragSmallOnly
                                    ? "Alleen klein"
                                    : "Alleen breed"
                            }
                            onWidgetClick={onWidgetClick}
                            onWidgetRemove={onWidgetRemove}
                        />
                    </div>
                );
            })}
        </div>
    );
}
