import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { GridSizeSelector } from "./GridSizeSelector";
import { getWidgetSupportedSizesCached } from "@/lib/widgetConfig";
import { WidgetPreviewRenderer } from "./WidgetPreviewRenderer";
import type { GridSize } from "./GridSizeSelector";

export interface Widget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
    grid_row: number;
    grid_col: number;
    data?: any;
}

const GRID_COLS = 6;
const GRID_ROWS = 5;
const MIN_COL_SPAN = 2;
const MAX_COL_SPAN = 6;
const MIN_ROW_SPAN = 1;
const MAX_ROW_SPAN = 5;

const WIDGET_COVER_IMAGES: Record<string, string> = {
    birthday: "/storage/widgetsCoverImages/verjaardagen.png",
    room_availability: "/storage/widgetsCoverImages/ruimte-beschikbaarheid.png",
    clock_weather: "/storage/widgetsCoverImages/klok-datum-weer.png",
    announcements: "/storage/widgetsCoverImages/mededelingen.png",
    toggl_time_tracking: "/storage/widgetsCoverImages/toggl-uren-tracking.png",
    image_widget: "/storage/widgetsCoverImages/afbeelding-slideshow.png",
};

interface DraggableWidgetProps {
    widget: Widget;
    screenId: number;
    widgetTypes: Record<string, string>;
    isSelected: boolean;
    onWidgetClick: (widget: Widget) => void;
    onWidgetRemove: (widgetId: number) => void;
    onResize?: (
        widgetId: number,
        newColSpan: number,
        newRowSpan: number,
    ) => void;
}

function DraggableWidget({
    widget,
    screenId,
    widgetTypes,
    isSelected,
    onWidgetClick,
    onWidgetRemove,
    onResize,
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

    const [isResizing, setIsResizing] = useState(false);
    const [supportedSizes, setSupportedSizes] = useState<GridSize[]>([
        { cols: 2, rows: 1 },
        { cols: 2, rows: 2 },
        { cols: 2, rows: 5 },
    ]);
    const [resizeStart, setResizeStart] = useState({
        x: 0,
        y: 0,
        colSpan: widget.grid_col_span,
        rowSpan: widget.grid_row_span,
    });
    const [currentDimensions, setCurrentDimensions] = useState({
        colSpan: widget.grid_col_span,
        rowSpan: widget.grid_row_span,
    });

    // Load widget-specific supported sizes
    useEffect(() => {
        const sizes = getWidgetSupportedSizesCached(widget.widget_type);
        setSupportedSizes(sizes);
    }, [widget.widget_type]);

    const handleGridSizeChange = (newColSpan: number, newRowSpan: number) => {
        onResize?.(widget.id, newColSpan, newRowSpan);
    };

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined;

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            colSpan: widget.grid_col_span,
            rowSpan: widget.grid_row_span,
        });
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = (e.clientX - resizeStart.x) / 60;
            const deltaY = (e.clientY - resizeStart.y) / 60;

            const newColSpan = Math.max(
                MIN_COL_SPAN,
                Math.min(
                    MAX_COL_SPAN,
                    Math.round(resizeStart.colSpan + deltaX),
                ),
            );
            const newRowSpan = Math.max(
                MIN_ROW_SPAN,
                Math.min(
                    MAX_ROW_SPAN,
                    Math.round(resizeStart.rowSpan + deltaY),
                ),
            );

            setCurrentDimensions({ colSpan: newColSpan, rowSpan: newRowSpan });
            onResize?.(widget.id, newColSpan, newRowSpan);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, resizeStart, widget.id, onResize]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`w-full h-full relative flex flex-col ${isDragging ? "opacity-0" : ""}`}
        >
            {/* Top Bar with Widget Title, Size Selector, and Delete Button */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b border-border flex-shrink-0">
                {/* Left side: Drag handle and title */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                        {...listeners}
                        {...attributes}
                        title="Drag to move widget"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <span
                        className="font-archia text-sm font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onWidgetClick(widget)}
                        title={`Edit ${widgetTypes[widget.widget_type] ?? widget.widget_type}`}
                    >
                        {widgetTypes[widget.widget_type] ?? widget.widget_type}
                    </span>
                </div>

                {/* Right side: Size selector and delete button */}
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <GridSizeSelector
                        currentColSpan={widget.grid_col_span}
                        currentRowSpan={widget.grid_row_span}
                        onSizeChange={handleGridSizeChange}
                        maxColSpan={MAX_COL_SPAN}
                        maxRowSpan={MAX_ROW_SPAN}
                        supportedSizes={supportedSizes}
                        widgetType={widget.widget_type}
                    />
                    <button
                        className="h-6 w-6 rounded hover:bg-destructive hover:text-destructive-foreground text-muted-foreground/50 flex items-center justify-center transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onWidgetRemove(widget.id);
                        }}
                        title="Delete widget"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
                {/* Widget Preview */}
                <div className="absolute inset-0 pointer-events-none">
                    <WidgetPreviewRenderer widget={widget} isPreview={true} />
                </div>
            </div>
        </div>
    );
}

interface CanvasCellProps {
    cellId: string;
    screenId: number;
    widget?: Widget;
    widgetTypes: Record<string, string>;
    isScreenActive: boolean;
    isSelected: boolean;
    onWidgetClick: (widget: Widget) => void;
    onWidgetRemove: (widgetId: number) => void;
    onResize?: (
        widgetId: number,
        newColSpan: number,
        newRowSpan: number,
    ) => void;
}

function CanvasCell({
    cellId,
    screenId,
    widget,
    widgetTypes,
    isScreenActive,
    isSelected,
    onWidgetClick,
    onWidgetRemove,
    onResize,
}: CanvasCellProps) {
    const { isOver, setNodeRef } = useDroppable({ id: cellId });

    let borderClass = "";
    let bgClass = "";

    if (widget) {
        if (isSelected) {
            borderClass = "border-solid border-primary";
            bgClass = "bg-primary/10";
        } else if (isOver) {
            borderClass = "border-solid border-primary/60";
            bgClass = "bg-primary/5";
        } else {
            borderClass = "border-solid border-border";
            bgClass = "bg-muted/40";
        }
    } else {
        if (isOver && isScreenActive) {
            borderClass = "border-dashed border-primary";
            bgClass = "bg-primary/5 scale-[1.02]";
        } else if (isScreenActive) {
            borderClass =
                "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50";
            bgClass = "bg-muted/20";
        } else {
            borderClass = "border-dashed border-muted-foreground/12";
            bgClass = "bg-muted/10";
        }
    }

    const coverImage = widget
        ? WIDGET_COVER_IMAGES[widget.widget_type]
        : undefined;

    return (
        <div
            ref={setNodeRef}
            className={`relative rounded-lg border-2 w-full h-full flex flex-col transition-all duration-150 overflow-hidden ${borderClass} ${bgClass}`}
        >
            {widget && coverImage && (
                <img
                    src={coverImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-15 pointer-events-none select-none"
                />
            )}

            {widget ? (
                <DraggableWidget
                    widget={widget}
                    screenId={screenId}
                    widgetTypes={widgetTypes}
                    isSelected={isSelected}
                    onWidgetClick={onWidgetClick}
                    onWidgetRemove={onWidgetRemove}
                    onResize={onResize}
                />
            ) : (
                <div className="flex items-center justify-center h-full w-full">
                    <span
                        className={`font-archia text-xs select-none transition-colors ${
                            isOver && isScreenActive
                                ? "text-primary font-medium"
                                : isScreenActive
                                  ? "text-muted-foreground/40"
                                  : "text-transparent"
                        }`}
                    >
                        {isOver && isScreenActive ? "Drop here" : "Drag here"}
                    </span>
                </div>
            )}
        </div>
    );
}

export interface ScreenCanvasProps {
    screenId: number;
    widgets: Widget[];
    widgetTypes: Record<string, string>;
    isScreenActive: boolean;
    selectedWidgetId?: number | null;
    onWidgetClick: (widget: Widget) => void;
    onWidgetRemove: (widgetId: number) => void;
    onWidgetResize?: (
        widgetId: number,
        newColSpan: number,
        newRowSpan: number,
    ) => void;
}

export function ScreenCanvas({
    screenId,
    widgets,
    widgetTypes,
    isScreenActive,
    selectedWidgetId,
    onWidgetClick,
    onWidgetRemove,
    onWidgetResize,
}: ScreenCanvasProps) {
    // Create a grid to track which cells are occupied
    const grid: boolean[][] = Array(GRID_ROWS)
        .fill(null)
        .map(() => Array(GRID_COLS).fill(false));

    // Map to store widget positions
    const widgetPositions = new Map<number, { row: number; col: number }>();

    // Sort widgets by grid_order and place them on the grid
    const sortedWidgets = [...widgets].sort(
        (a, b) => a.grid_order - b.grid_order,
    );

    sortedWidgets.forEach((widget) => {
        // Use explicit grid_row and grid_col if they exist, otherwise find first available position
        let row = widget.grid_row ?? -1;
        let col = widget.grid_col ?? -1;
        let placed = false;

        if (row >= 0 && col >= 0) {
            // Try to place at explicit position
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
                    // Mark cells as occupied
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

        // If explicit position didn't work, find first available position
        if (!placed) {
            for (let r = 0; r < GRID_ROWS && !placed; r++) {
                for (let c = 0; c < GRID_COLS && !placed; c++) {
                    // Check if this position and its span don't exceed grid bounds and aren't occupied
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
                            // Mark cells as occupied
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

    // Create only cells that should be rendered (widgets at their start position + truly empty cells)
    const cellsToRender = [];
    const renderedCells = new Set<string>();

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const cellKey = `${row}-${col}`;

            // Skip if this cell is occupied by another widget's span
            if (grid[row][col] && renderedCells.has(cellKey)) {
                continue;
            }

            // Check if there's a widget at this position
            let widget = null;
            for (const w of sortedWidgets) {
                const pos = widgetPositions.get(w.id);
                if (pos && pos.row === row && pos.col === col) {
                    widget = w;
                    break;
                }
            }

            if (widget) {
                // Mark all cells this widget spans as rendered
                for (let r = row; r < row + widget.grid_row_span; r++) {
                    for (let c = col; c < col + widget.grid_col_span; c++) {
                        renderedCells.add(`${r}-${c}`);
                    }
                }
                cellsToRender.push({
                    widget,
                    row,
                    col,
                    isOccupied: true,
                });
            } else if (!grid[row][col]) {
                // Only render empty cells that aren't occupied
                renderedCells.add(cellKey);
                cellsToRender.push({
                    widget: null,
                    row,
                    col,
                    isOccupied: false,
                });
            }
        }
    }

    return (
        <div
            className="grid gap-3 mt-1"
            style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                gridAutoRows: `minmax(120px, 1fr)`,
            }}
        >
            {cellsToRender.map(({ widget, row, col, isOccupied }) => {
                if (widget) {
                    // Cell with widget - rendered once at its start position
                    return (
                        <div
                            key={`cell-${widget.id}`}
                            style={{
                                gridColumn: `${col + 1} / span ${widget.grid_col_span}`,
                                gridRow: `${row + 1} / span ${widget.grid_row_span}`,
                            }}
                        >
                            <CanvasCell
                                cellId={`cell-${screenId}-${row}-${col}`}
                                screenId={screenId}
                                widget={widget}
                                widgetTypes={widgetTypes}
                                isScreenActive={isScreenActive}
                                isSelected={widget.id === selectedWidgetId}
                                onWidgetClick={onWidgetClick}
                                onWidgetRemove={onWidgetRemove}
                                onResize={onWidgetResize}
                            />
                        </div>
                    );
                } else {
                    // Only truly empty cells are rendered and droppable
                    return (
                        <div key={`empty-${row}-${col}`}>
                            <CanvasCell
                                cellId={`cell-${screenId}-${row}-${col}`}
                                screenId={screenId}
                                widget={undefined}
                                widgetTypes={widgetTypes}
                                isScreenActive={isScreenActive}
                                isSelected={false}
                                onWidgetClick={onWidgetClick}
                                onWidgetRemove={onWidgetRemove}
                                onResize={onWidgetResize}
                            />
                        </div>
                    );
                }
            })}
        </div>
    );
}
