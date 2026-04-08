import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import axios from "axios";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { Button } from "@/Components/ui/button";
import { ExternalLink, GripVertical, Monitor } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/Components/ui/sheet";
import { ScreenCanvas } from "@/Components/Screens/ScreenCanvas";
import { WidgetLibraryAccordion } from "@/Components/Screens/WidgetLibraryAccordion";
import { WidgetSettingsPanel } from "@/Components/Screens/WidgetSettingsPanel";
import type { Widget } from "@/Components/Screens/ScreenCanvas";

interface Screen {
    id: number;
    name: string;
    description: string | null;
    refresh_interval: number;
    layout?: any;
    view_mode?: any;
    featured_widget_id: number | null;
    widgets_count: number;
    widgets: Widget[];
    created_at: string;
    updated_at: string;
}

interface ScreensIndexProps extends PageProps {
    screens: Screen[];
    widgetTypes: Record<string, string>;
}

interface SelectedWidget {
    widget: Widget;
    screenId: number;
}

export default function Index({
    screens: initialScreens,
    widgetTypes,
}: ScreensIndexProps) {
    const [screens, setScreens] = useState<Screen[]>(initialScreens);
    const [selectedWidget, setSelectedWidget] = useState<SelectedWidget | null>(
        null,
    );
    const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
    const [activeDragWidgetType, setActiveDragWidgetType] = useState<
        string | null
    >(null);

    const activeScreenId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("active");
        return id ? parseInt(id, 10) : null;
    }, [window.location.search]);

    useEffect(() => {
        router.reload({ only: ["screens"] });
    }, []);

    useEffect(() => {
        setScreens(initialScreens);
    }, [initialScreens]);

    // Fetch widget data for preview rendering
    useEffect(() => {
        if (!activeScreenId) return;

        const fetchWidgetData = async () => {
            try {
                const response = await axios.get(
                    route("display.data", activeScreenId),
                );
                const widgetsWithData = response.data.widgets;

                setScreens((prev) =>
                    prev.map((s) =>
                        s.id === activeScreenId
                            ? {
                                  ...s,
                                  widgets: s.widgets.map((w) => {
                                      const widgetData = widgetsWithData.find(
                                          (wd: any) => wd.id === w.id,
                                      );
                                      return widgetData
                                          ? { ...w, data: widgetData.data }
                                          : w;
                                  }),
                              }
                            : s,
                    ),
                );
            } catch (error) {
                console.error("Error fetching widget data:", error);
            }
        };

        fetchWidgetData();
    }, [activeScreenId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;

    const handleDelete = (screenId: number) => {
        if (confirm("Are you sure you want to delete this screen?")) {
            router.delete(route("screens.destroy", screenId));
        }
    };

    const handleWidgetDrop = async (screenId: number, widgetType: string) => {
        const screen = screens.find((s) => s.id === screenId);
        if (!screen) return;

        try {
            let gridOrder = 0;
            while (screen.widgets.some((w) => w.grid_order === gridOrder)) {
                gridOrder++;
            }

            // Find first available grid position
            const GRID_COLS = 6;
            const GRID_ROWS = 5;
            const grid = Array(GRID_ROWS)
                .fill(null)
                .map(() => Array(GRID_COLS).fill(false));

            // Mark occupied cells
            screen.widgets.forEach((w) => {
                for (
                    let r = w.grid_row;
                    r < w.grid_row + w.grid_row_span;
                    r++
                ) {
                    for (
                        let c = w.grid_col;
                        c < w.grid_col + w.grid_col_span;
                        c++
                    ) {
                        if (
                            r >= 0 &&
                            c >= 0 &&
                            r < GRID_ROWS &&
                            c < GRID_COLS
                        ) {
                            grid[r][c] = true;
                        }
                    }
                }
            });

            // Find first available 2x2 position
            let gridRow = 0;
            let gridCol = 0;
            let found = false;

            for (let r = 0; r < GRID_ROWS && !found; r++) {
                for (let c = 0; c < GRID_COLS && !found; c++) {
                    if (c + 2 <= GRID_COLS && r + 2 <= GRID_ROWS) {
                        let canPlace = true;
                        for (let rr = r; rr < r + 2; rr++) {
                            for (let cc = c; cc < c + 2; cc++) {
                                if (grid[rr][cc]) {
                                    canPlace = false;
                                    break;
                                }
                            }
                            if (!canPlace) break;
                        }

                        if (canPlace) {
                            gridRow = r;
                            gridCol = c;
                            found = true;
                        }
                    }
                }
            }

            const response = await axios.post(
                route("widgets.store", screenId),
                {
                    widget_type: widgetType,
                    grid_col_span: 2,
                    grid_row_span: 2,
                    grid_order: gridOrder,
                    grid_row: gridRow,
                    grid_col: gridCol,
                    config: null,
                },
            );

            const newWidget: Widget = response.data;

            setScreens((prev) =>
                prev.map((s) =>
                    s.id === screenId
                        ? {
                              ...s,
                              widgets: [...s.widgets, newWidget],
                              widgets_count: s.widgets_count + 1,
                          }
                        : s,
                ),
            );
        } catch (error) {
            console.error("Error creating widget:", error);
        }
    };

    const handleWidgetRemove = async (widgetId: number) => {
        if (!activeScreenId) return;
        try {
            await axios.delete(route("widgets.destroy", widgetId));

            const screen = screens.find((s) => s.id === activeScreenId);
            const clearFeatured = screen?.featured_widget_id === widgetId;

            setScreens((prev) =>
                prev.map((s) =>
                    s.id === activeScreenId
                        ? {
                              ...s,
                              widgets: s.widgets.filter(
                                  (w) => w.id !== widgetId,
                              ),
                              widgets_count: s.widgets_count - 1,
                              ...(clearFeatured
                                  ? { featured_widget_id: null }
                                  : {}),
                          }
                        : s,
                ),
            );

            if (selectedWidget && selectedWidget.widget.id === widgetId) {
                setSelectedWidget(null);
            }
        } catch (error) {
            console.error("Error deleting widget:", error);
        }
    };

    const handleWidgetClick = (widget: Widget) => {
        if (!activeScreenId) return;
        setSelectedWidget({ widget, screenId: activeScreenId });
    };

    const handleWidgetTypeClick = (widgetType: string) => {
        if (!activeScreen) return;
        const widget = activeScreen.widgets.find(
            (w) => w.widget_type === widgetType,
        );
        if (widget) {
            setSelectedWidget({ widget, screenId: activeScreen.id });
        }
    };

    const handleWidgetResize = async (
        widgetId: number,
        newColSpan: number,
        newRowSpan: number,
    ) => {
        if (!activeScreenId) return;

        setScreens((prev) =>
            prev.map((s) =>
                s.id === activeScreenId
                    ? {
                          ...s,
                          widgets: s.widgets.map((w) =>
                              w.id === widgetId
                                  ? {
                                        ...w,
                                        grid_col_span: newColSpan,
                                        grid_row_span: newRowSpan,
                                    }
                                  : w,
                          ),
                      }
                    : s,
            ),
        );

        try {
            await axios.patch(route("widgets.update", widgetId), {
                grid_col_span: newColSpan,
                grid_row_span: newRowSpan,
            });
        } catch (error) {
            console.error("Error resizing widget:", error);
        }
    };

    const handleWidgetReorder = async (
        widgetId: number,
        targetRow: number,
        targetCol: number,
    ) => {
        if (!activeScreenId) return;

        const screen = screens.find((s) => s.id === activeScreenId);
        if (!screen) return;

        // Check if the target position is valid
        const movedWidget = screen.widgets.find((w) => w.id === widgetId);
        if (!movedWidget) return;

        // Check if there's a widget at the target position
        const targetWidget = screen.widgets.find(
            (w) =>
                w.grid_row === targetRow &&
                w.grid_col === targetCol &&
                w.id !== widgetId,
        );

        // If there's a widget at the target position, check if we can swap
        if (targetWidget) {
            const GRID_COLS = 6;
            const GRID_ROWS = 5;

            // Check if the target widget can fit in the moved widget's original position
            const movedWidgetOriginalRow = movedWidget.grid_row;
            const movedWidgetOriginalCol = movedWidget.grid_col;

            // Create a temporary grid to check if swap is possible
            const tempGrid = Array(GRID_ROWS)
                .fill(null)
                .map(() => Array(GRID_COLS).fill(false));

            // Mark all widgets except the two we're swapping
            screen.widgets.forEach((w) => {
                if (w.id !== movedWidget.id && w.id !== targetWidget.id) {
                    for (
                        let r = w.grid_row;
                        r < w.grid_row + w.grid_row_span;
                        r++
                    ) {
                        for (
                            let c = w.grid_col;
                            c < w.grid_col + w.grid_col_span;
                            c++
                        ) {
                            if (
                                r >= 0 &&
                                c >= 0 &&
                                r < GRID_ROWS &&
                                c < GRID_COLS
                            ) {
                                tempGrid[r][c] = true;
                            }
                        }
                    }
                }
            });

            // Check if moved widget can fit at target widget's position
            let canPlaceMovedWidget = true;
            if (
                targetRow + movedWidget.grid_row_span <= GRID_ROWS &&
                targetCol + movedWidget.grid_col_span <= GRID_COLS
            ) {
                for (
                    let r = targetRow;
                    r < targetRow + movedWidget.grid_row_span;
                    r++
                ) {
                    for (
                        let c = targetCol;
                        c < targetCol + movedWidget.grid_col_span;
                        c++
                    ) {
                        if (tempGrid[r][c]) {
                            canPlaceMovedWidget = false;
                            break;
                        }
                    }
                    if (!canPlaceMovedWidget) break;
                }
            } else {
                canPlaceMovedWidget = false;
            }

            // Check if target widget can fit at moved widget's original position
            let canPlaceTargetWidget = true;
            if (
                movedWidgetOriginalRow + targetWidget.grid_row_span <=
                    GRID_ROWS &&
                movedWidgetOriginalCol + targetWidget.grid_col_span <= GRID_COLS
            ) {
                for (
                    let r = movedWidgetOriginalRow;
                    r < movedWidgetOriginalRow + targetWidget.grid_row_span;
                    r++
                ) {
                    for (
                        let c = movedWidgetOriginalCol;
                        c < movedWidgetOriginalCol + targetWidget.grid_col_span;
                        c++
                    ) {
                        if (tempGrid[r][c]) {
                            canPlaceTargetWidget = false;
                            break;
                        }
                    }
                    if (!canPlaceTargetWidget) break;
                }
            } else {
                canPlaceTargetWidget = false;
            }

            // If both widgets can fit, perform the swap
            if (canPlaceMovedWidget && canPlaceTargetWidget) {
                setScreens((prev) =>
                    prev.map((s) =>
                        s.id === activeScreenId
                            ? {
                                  ...s,
                                  widgets: s.widgets.map((w) => {
                                      if (w.id === movedWidget.id) {
                                          return {
                                              ...w,
                                              grid_row: targetRow,
                                              grid_col: targetCol,
                                          };
                                      }
                                      if (w.id === targetWidget.id) {
                                          return {
                                              ...w,
                                              grid_row: movedWidgetOriginalRow,
                                              grid_col: movedWidgetOriginalCol,
                                          };
                                      }
                                      return w;
                                  }),
                              }
                            : s,
                    ),
                );

                try {
                    // Perform both updates in parallel
                    await Promise.all([
                        axios.patch(route("widgets.update", movedWidget.id), {
                            grid_row: targetRow,
                            grid_col: targetCol,
                        }),
                        axios.patch(route("widgets.update", targetWidget.id), {
                            grid_row: movedWidgetOriginalRow,
                            grid_col: movedWidgetOriginalCol,
                        }),
                    ]);
                } catch (error) {
                    console.error("Error swapping widgets:", error);
                    router.reload({ only: ["screens"] });
                }
                return;
            }
        }

        // If no widget at target position or swap not possible, just move the widget
        setScreens((prev) =>
            prev.map((s) =>
                s.id === activeScreenId
                    ? {
                          ...s,
                          widgets: s.widgets.map((w) =>
                              w.id === widgetId
                                  ? {
                                        ...w,
                                        grid_row: targetRow,
                                        grid_col: targetCol,
                                    }
                                  : w,
                          ),
                      }
                    : s,
            ),
        );

        try {
            await axios.patch(route("widgets.update", widgetId), {
                grid_row: targetRow,
                grid_col: targetCol,
            });
        } catch (error) {
            console.error("Error reordering widget:", error);
            router.reload({ only: ["screens"] });
        }
    };

    const handleWidgetSaved = (updatedWidget: Widget) => {
        if (!activeScreenId) return;
        setScreens((prev) =>
            prev.map((s) => ({
                ...s,
                widgets: s.widgets.map((w) => {
                    if (w.id === updatedWidget.id) return updatedWidget;
                    if (updatedWidget.widget_type === "image_widget") return w;
                    if (w.widget_type === updatedWidget.widget_type) {
                        return { ...w, config: updatedWidget.config };
                    }
                    return w;
                }),
            })),
        );
        if (selectedWidget) {
            setSelectedWidget({
                widget: updatedWidget,
                screenId: activeScreenId,
            });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current;
        if (data?.widgetType) {
            setActiveDragLabel(widgetTypes[data.widgetType] ?? data.widgetType);
            setActiveDragWidgetType(data.widgetType);
        } else if (data?.existingWidgetId) {
            const screen = screens.find((s) => s.id === data.screenId);
            const widget = screen?.widgets.find(
                (w) => w.id === data.existingWidgetId,
            );
            setActiveDragLabel(
                widget
                    ? (widgetTypes[widget.widget_type] ?? widget.widget_type)
                    : null,
            );
            setActiveDragWidgetType(widget?.widget_type ?? null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragLabel(null);
        setActiveDragWidgetType(null);
        const { active, over } = event;
        if (!over) return;

        const overId = String(over.id);
        const data = active.data.current;

        // For new widget drops from library
        if (data?.widgetType && activeScreenId) {
            handleWidgetDrop(activeScreenId, data.widgetType);
        }
        // For existing widget reordering
        else if (data?.existingWidgetId && activeScreenId) {
            const screen = screens.find((s) => s.id === activeScreenId);
            if (!screen) return;

            // Parse the target position from the cell ID
            // Cell ID format: "cell-{screenId}-{row}-{col}"
            const parts = overId.split("-");
            if (
                overId.startsWith("cell-") &&
                parts.length >= 4 &&
                parts[1] === String(activeScreenId)
            ) {
                const targetRow = parseInt(parts[2], 10);
                const targetCol = parseInt(parts[3], 10);

                handleWidgetReorder(
                    data.existingWidgetId,
                    targetRow,
                    targetCol,
                );
            }
        }
    };

    return (
        <AppLayout>
            <Head title="Screens" />

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {screens.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Monitor className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h2 className="font-archia text-2xl font-semibold mb-2">
                            No screens yet
                        </h2>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            Create your first screen to start building your
                            dashboard display. Use the + button in the sidebar
                            to get started.
                        </p>
                    </div>
                )}

                {screens.length > 0 && !activeScreen && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Monitor className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h2 className="font-archia text-2xl font-semibold mb-2">
                            Select a screen
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Choose a screen from the sidebar to view and edit
                            its canvas.
                        </p>
                    </div>
                )}

                {activeScreen && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-archia text-2xl font-semibold">
                                        {activeScreen.name}
                                    </h2>
                                    {activeScreen.description && (
                                        <span className="text-sm text-muted-foreground hidden md:inline">
                                            {activeScreen.description}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-8"
                                >
                                    <a
                                        href={route(
                                            "display.show",
                                            activeScreen.id,
                                        )}
                                        target="_blank"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View Display
                                    </a>
                                </Button>
                            </div>

                            <div className="flex-1 overflow-auto rounded-xl bg-muted/40 p-5">
                                <ScreenCanvas
                                    screenId={activeScreen.id}
                                    widgets={activeScreen.widgets}
                                    widgetTypes={widgetTypes}
                                    isScreenActive={true}
                                    onWidgetClick={handleWidgetClick}
                                    onWidgetRemove={handleWidgetRemove}
                                    onWidgetResize={handleWidgetResize}
                                    selectedWidgetId={
                                        selectedWidget &&
                                        selectedWidget.screenId ===
                                            activeScreen.id
                                            ? selectedWidget.widget.id
                                            : null
                                    }
                                />
                            </div>
                        </div>

                        {/* Widget Library Accordion - bottom right */}
                        <WidgetLibraryAccordion
                            widgetTypes={widgetTypes}
                            onWidgetTypeClick={handleWidgetTypeClick}
                        />
                    </div>
                )}

                <Sheet
                    open={selectedWidget !== null}
                    onOpenChange={(open) => {
                        if (!open) setSelectedWidget(null);
                    }}
                >
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle className="font-archia">
                                Widget Settings
                            </SheetTitle>
                            <SheetDescription>
                                Configure the selected widget.
                            </SheetDescription>
                        </SheetHeader>
                        {selectedWidget && (
                            <div className="mt-4">
                                <WidgetSettingsPanel
                                    key={selectedWidget.widget.id}
                                    widget={selectedWidget.widget}
                                    widgetTypes={widgetTypes}
                                    onClose={() => setSelectedWidget(null)}
                                    onSaved={handleWidgetSaved}
                                />
                            </div>
                        )}
                    </SheetContent>
                </Sheet>

                <DragOverlay dropAnimation={null}>
                    {activeDragLabel ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card shadow-xl opacity-95 pointer-events-none">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            <span className="font-archia text-sm font-medium">
                                {activeDragLabel}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </AppLayout>
    );
}
