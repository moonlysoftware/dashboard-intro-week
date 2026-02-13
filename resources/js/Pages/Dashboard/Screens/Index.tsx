import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import axios from 'axios';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Button } from '@/Components/ui/button';
import {
    PanelLeft,
    PanelRight,
    ExternalLink,
    GripVertical,
    Monitor,
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/Components/ui/sheet';
import { ScreenCanvas } from '@/Components/Screens/ScreenCanvas';
import { WidgetLibraryPanel } from '@/Components/Screens/WidgetLibraryPanel';
import { WidgetSettingsPanel } from '@/Components/Screens/WidgetSettingsPanel';
import type { Widget } from '@/Components/Screens/ScreenCanvas';
import { isWideOnlyWidget, isSmallOnlyWidget, isSmallSlot } from '@/constants/widgets';

type BentoLayout = 'bento_start_small' | 'bento_start_large';

interface Screen {
    id: number;
    name: string;
    description: string | null;
    refresh_interval: number;
    layout: BentoLayout;
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

export default function Index({ screens: initialScreens, widgetTypes }: ScreensIndexProps) {
    const [screens, setScreens] = useState<Screen[]>(initialScreens);
    const [selectedWidget, setSelectedWidget] = useState<SelectedWidget | null>(null);
    const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
    const [activeDragWidgetType, setActiveDragWidgetType] = useState<string | null>(null);

    // Parse active screen ID from URL query params
    const activeScreenId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('active');
        return id ? parseInt(id, 10) : null;
    }, [window.location.search]);

    useEffect(() => {
        router.reload({ only: ['screens'] });
    }, []);

    useEffect(() => {
        setScreens(initialScreens);
    }, [initialScreens]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;

    const handleDelete = (screenId: number) => {
        if (confirm('Are you sure you want to delete this screen?')) {
            router.delete(route('screens.destroy', screenId));
        }
    };

    const handleWidgetDrop = async (screenId: number, slotIndex: number, widgetType: string) => {
        const screen = screens.find((s) => s.id === screenId);
        if (!screen) return;

        if (screen.widgets.length >= 4) return;
        if (screen.widgets.some((w) => w.grid_order === slotIndex)) return;
        if (isWideOnlyWidget(widgetType) && isSmallSlot(slotIndex, screen.layout)) return;
        if (isSmallOnlyWidget(widgetType) && !isSmallSlot(slotIndex, screen.layout)) return;

        try {
            const response = await axios.post(route('widgets.store', screenId), {
                widget_type: widgetType,
                grid_col_span: 6,
                grid_row_span: 1,
                grid_order: slotIndex,
                config: null,
            });

            const newWidget: Widget = response.data;

            setScreens((prev) =>
                prev.map((s) =>
                    s.id === screenId
                        ? { ...s, widgets: [...s.widgets, newWidget], widgets_count: s.widgets_count + 1 }
                        : s
                )
            );
        } catch (error) {
            console.error('Error creating widget:', error);
        }
    };

    const handleWidgetReorder = async (
        screenId: number,
        widgetId: number,
        currentOrder: number,
        newOrder: number
    ) => {
        const screen = screens.find((s) => s.id === screenId);
        if (!screen) return;

        const movingWidget = screen.widgets.find((w) => w.id === widgetId);
        if (movingWidget && isWideOnlyWidget(movingWidget.widget_type) && isSmallSlot(newOrder, screen.layout)) return;
        if (movingWidget && isSmallOnlyWidget(movingWidget.widget_type) && !isSmallSlot(newOrder, screen.layout)) return;

        const targetWidget = screen.widgets.find((w) => w.grid_order === newOrder);

        setScreens((prev) =>
            prev.map((s) => {
                if (s.id !== screenId) return s;
                return {
                    ...s,
                    widgets: s.widgets.map((w) => {
                        if (w.id === widgetId) return { ...w, grid_order: newOrder };
                        if (targetWidget && w.id === targetWidget.id) return { ...w, grid_order: currentOrder };
                        return w;
                    }),
                };
            })
        );

        if (selectedWidget && selectedWidget.screenId === screenId) {
            if (selectedWidget.widget.id === widgetId) {
                setSelectedWidget({ ...selectedWidget, widget: { ...selectedWidget.widget, grid_order: newOrder } });
            } else if (targetWidget && selectedWidget.widget.id === targetWidget.id) {
                setSelectedWidget({ ...selectedWidget, widget: { ...selectedWidget.widget, grid_order: currentOrder } });
            }
        }

        try {
            if (targetWidget) {
                await Promise.all([
                    axios.patch(route('widgets.update', widgetId), { grid_order: newOrder }),
                    axios.patch(route('widgets.update', targetWidget.id), { grid_order: currentOrder }),
                ]);
            } else {
                await axios.patch(route('widgets.update', widgetId), { grid_order: newOrder });
            }
        } catch (error) {
            console.error('Error reordering widget:', error);
            setScreens((prev) =>
                prev.map((s) => {
                    if (s.id !== screenId) return s;
                    return {
                        ...s,
                        widgets: s.widgets.map((w) => {
                            if (w.id === widgetId) return { ...w, grid_order: currentOrder };
                            if (targetWidget && w.id === targetWidget.id) return { ...w, grid_order: newOrder };
                            return w;
                        }),
                    };
                })
            );
        }
    };

    const handleWidgetRemove = async (widgetId: number) => {
        if (!activeScreenId) return;
        if (!confirm('Remove widget?')) return;
        try {
            await axios.delete(route('widgets.destroy', widgetId));

            setScreens((prev) =>
                prev.map((s) =>
                    s.id === activeScreenId
                        ? { ...s, widgets: s.widgets.filter((w) => w.id !== widgetId), widgets_count: s.widgets_count - 1 }
                        : s
                )
            );

            if (selectedWidget && selectedWidget.widget.id === widgetId) {
                setSelectedWidget(null);
            }
        } catch (error) {
            console.error('Error deleting widget:', error);
        }
    };

    const handleWidgetClick = (widget: Widget) => {
        if (!activeScreenId) return;
        setSelectedWidget({ widget, screenId: activeScreenId });
    };

    const handleWidgetTypeClick = (widgetType: string) => {
        if (!activeScreen) return;
        const widget = activeScreen.widgets.find((w) => w.widget_type === widgetType);
        if (widget) {
            setSelectedWidget({ widget, screenId: activeScreen.id });
        }
    };

    const handleLayoutChange = async (layout: BentoLayout) => {
        if (!activeScreen) return;
        const screenId = activeScreen.id;
        const screen = activeScreen;

        const pairs: [number, number][] = [[0, 1], [2, 3]];
        const swaps: { id: number; newOrder: number; oldOrder: number }[] = [];

        for (const [slotA, slotB] of pairs) {
            const widgetA = screen.widgets.find((w) => w.grid_order === slotA);
            const widgetB = screen.widgets.find((w) => w.grid_order === slotB);

            const aViolates = widgetA && (
                (isWideOnlyWidget(widgetA.widget_type) && isSmallSlot(slotA, layout)) ||
                (isSmallOnlyWidget(widgetA.widget_type) && !isSmallSlot(slotA, layout))
            );
            const bViolates = widgetB && (
                (isWideOnlyWidget(widgetB.widget_type) && isSmallSlot(slotB, layout)) ||
                (isSmallOnlyWidget(widgetB.widget_type) && !isSmallSlot(slotB, layout))
            );

            if (aViolates || bViolates) {
                if (widgetA) swaps.push({ id: widgetA.id, newOrder: slotB, oldOrder: slotA });
                if (widgetB) swaps.push({ id: widgetB.id, newOrder: slotA, oldOrder: slotB });
            }
        }

        setScreens((prev) =>
            prev.map((s) => {
                if (s.id !== screenId) return s;
                const updatedWidgets = s.widgets.map((w) => {
                    const swap = swaps.find((sw) => sw.id === w.id);
                    return swap ? { ...w, grid_order: swap.newOrder } : w;
                });
                return { ...s, layout, widgets: updatedWidgets };
            })
        );

        try {
            await Promise.all([
                axios.patch(route('screens.updateLayout', screenId), { layout }),
                ...swaps.map((sw) =>
                    axios.patch(route('widgets.update', sw.id), { grid_order: sw.newOrder })
                ),
            ]);
        } catch (error) {
            console.error('Error updating layout:', error);
            const oldLayout: BentoLayout = layout === 'bento_start_small' ? 'bento_start_large' : 'bento_start_small';
            setScreens((prev) =>
                prev.map((s) => {
                    if (s.id !== screenId) return s;
                    const restoredWidgets = s.widgets.map((w) => {
                        const swap = swaps.find((sw) => sw.id === w.id);
                        return swap ? { ...w, grid_order: swap.oldOrder } : w;
                    });
                    return { ...s, layout: oldLayout, widgets: restoredWidgets };
                })
            );
        }
    };

    const handleWidgetSaved = (updatedWidget: Widget) => {
        if (!activeScreenId) return;
        setScreens((prev) =>
            prev.map((s) => ({
                ...s,
                widgets: s.widgets.map((w) => {
                    if (w.id === updatedWidget.id) return updatedWidget;
                    if (updatedWidget.widget_type === 'image_widget') return w;
                    if (w.widget_type === updatedWidget.widget_type) {
                        return { ...w, config: updatedWidget.config };
                    }
                    return w;
                }),
            }))
        );
        if (selectedWidget) {
            setSelectedWidget({ widget: updatedWidget, screenId: activeScreenId });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current;
        if (data?.widgetType) {
            setActiveDragLabel(widgetTypes[data.widgetType] ?? data.widgetType);
            setActiveDragWidgetType(data.widgetType);
        } else if (data?.existingWidgetId) {
            const screen = screens.find((s) => s.id === data.screenId);
            const widget = screen?.widgets.find((w) => w.id === data.existingWidgetId);
            setActiveDragLabel(widget ? (widgetTypes[widget.widget_type] ?? widget.widget_type) : null);
            setActiveDragWidgetType(widget?.widget_type ?? null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragLabel(null);
        setActiveDragWidgetType(null);
        const { active, over } = event;
        if (!over) return;

        const overId = String(over.id);
        if (!overId.startsWith('slot-')) return;

        const parts = overId.split('-');
        const targetScreenId = parseInt(parts[1]);
        const targetSlotIndex = parseInt(parts[2]);
        if (isNaN(targetScreenId) || isNaN(targetSlotIndex)) return;

        const data = active.data.current;

        if (data?.widgetType) {
            if (targetScreenId !== activeScreenId) return;
            handleWidgetDrop(targetScreenId, targetSlotIndex, data.widgetType);
        } else if (data?.existingWidgetId) {
            if (data.screenId !== targetScreenId) return;
            if (data.currentOrder === targetSlotIndex) return;
            handleWidgetReorder(targetScreenId, data.existingWidgetId, data.currentOrder, targetSlotIndex);
        }
    };

    return (
        <AppLayout>
            <Head title="Screens" />

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* No screens exist */}
                {screens.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Monitor className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h2 className="font-archia text-2xl font-semibold mb-2">No screens yet</h2>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            Create your first screen to start building your dashboard display.
                            Use the + button in the sidebar to get started.
                        </p>
                    </div>
                )}

                {/* Screens exist but none selected */}
                {screens.length > 0 && !activeScreen && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Monitor className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h2 className="font-archia text-2xl font-semibold mb-2">Select a screen</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Choose a screen from the sidebar to view and edit its canvas.
                        </p>
                    </div>
                )}

                {/* Active screen selected */}
                {activeScreen && (
                    <div className="flex gap-6 items-start">
                        {/* Main content area */}
                        <div className="flex-1 min-w-0 space-y-5">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-archia text-2xl font-semibold">{activeScreen.name}</h2>
                                    {activeScreen.description && (
                                        <span className="text-sm text-muted-foreground hidden md:inline">
                                            {activeScreen.description}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Layout toggle */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 ${activeScreen.layout === 'bento_start_small' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                                        title="Small left, wide right"
                                        onClick={() => handleLayoutChange('bento_start_small')}
                                    >
                                        <PanelLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 ${activeScreen.layout === 'bento_start_large' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                                        title="Wide left, small right"
                                        onClick={() => handleLayoutChange('bento_start_large')}
                                    >
                                        <PanelRight className="h-4 w-4" />
                                    </Button>

                                    {/* View Display */}
                                    <Button variant="outline" size="sm" asChild className="h-8">
                                        <a href={route('display.show', activeScreen.id)} target="_blank">
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View Display
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Canvas area with subtle background */}
                            <div className="rounded-xl bg-muted/40 p-5">
                                <h3 className="font-archia text-sm font-medium text-muted-foreground mb-3">Canvas</h3>
                                <ScreenCanvas
                                    screenId={activeScreen.id}
                                    widgets={activeScreen.widgets}
                                    widgetTypes={widgetTypes}
                                    isScreenActive={true}
                                    layout={activeScreen.layout ?? 'bento_start_small'}
                                    activeDragWidgetType={activeDragWidgetType}
                                    onWidgetClick={handleWidgetClick}
                                    onWidgetRemove={handleWidgetRemove}
                                    selectedWidgetId={
                                        selectedWidget && selectedWidget.screenId === activeScreen.id
                                            ? selectedWidget.widget.id
                                            : null
                                    }
                                />
                            </div>
                        </div>

                        {/* Right-side Widget Library panel */}
                        <div className="w-72 flex-shrink-0 sticky top-4">
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <h3 className="font-archia text-base font-semibold mb-1">Widgets</h3>
                                <WidgetLibraryPanel
                                    widgetTypes={widgetTypes}
                                    onWidgetTypeClick={handleWidgetTypeClick}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Widget Settings Sheet */}
                <Sheet
                    open={selectedWidget !== null}
                    onOpenChange={(open) => {
                        if (!open) setSelectedWidget(null);
                    }}
                >
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle className="font-archia">Widget Settings</SheetTitle>
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
                            <span className="font-archia text-sm font-medium">{activeDragLabel}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </AppLayout>
    );
}
