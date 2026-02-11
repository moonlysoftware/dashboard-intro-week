import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
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
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, GripVertical, PanelLeft, PanelRight } from 'lucide-react';
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
    is_active: boolean;
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

export default function Index({ auth, screens: initialScreens, widgetTypes }: ScreensIndexProps) {
    const [screens, setScreens] = useState<Screen[]>(initialScreens);
    const [activeScreenId, setActiveScreenId] = useState<number | null>(null);
    const [selectedWidget, setSelectedWidget] = useState<SelectedWidget | null>(null);
    const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
    const [activeDragWidgetType, setActiveDragWidgetType] = useState<string | null>(null);

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


    const handleSelectScreen = (screenId: number) => {
        setActiveScreenId(screenId);
    };

    const handleDelete = (screenId: number) => {
        if (confirm('Weet je zeker dat je dit scherm wilt verwijderen?')) {
            router.delete(route('screens.destroy', screenId));
        }
    };


    const handleWidgetDrop = async (screenId: number, slotIndex: number, widgetType: string) => {
        const screen = screens.find((s) => s.id === screenId);
        if (!screen) return;

        // Max 4 widgets
        if (screen.widgets.length >= 4) return;

        // Slot already occupied
        if (screen.widgets.some((w) => w.grid_order === slotIndex)) return;

        // Wide-only widget cannot go into a small slot
        if (isWideOnlyWidget(widgetType) && isSmallSlot(slotIndex, screen.layout)) return;

        // Small-only widget cannot go into a large slot
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

        // Wide-only widget cannot be moved to a small slot
        const movingWidget = screen.widgets.find((w) => w.id === widgetId);
        if (movingWidget && isWideOnlyWidget(movingWidget.widget_type) && isSmallSlot(newOrder, screen.layout)) return;

        // Small-only widget cannot be moved to a large slot
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

    const handleWidgetRemove = async (screenId: number, widgetId: number) => {
        if (!confirm('Widget verwijderen?')) return;
        try {
            await axios.delete(route('widgets.destroy', widgetId));

            setScreens((prev) =>
                prev.map((s) =>
                    s.id === screenId
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

    const handleWidgetClick = (widget: Widget, screenId: number) => {
        setSelectedWidget({ widget, screenId });
    };

    const handleWidgetTypeClick = (widgetType: string) => {
        for (const screen of screens) {
            const widget = screen.widgets.find((w) => w.widget_type === widgetType);
            if (widget) {
                setSelectedWidget({ widget, screenId: screen.id });
                return;
            }
        }
    };

    const handleLayoutChange = async (screenId: number, layout: BentoLayout) => {
        const screen = screens.find((s) => s.id === screenId);
        if (!screen) return;

        // For each slot pair, check if any widget violates the new layout.
        // If so, swap the two widgets in that pair.
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

        // Optimistic update: apply layout + swaps at once
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
            // Rollback layout and any swapped widgets
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

    const handleWidgetSaved = (screenId: number, updatedWidget: Widget) => {
        // Config is shared across all widgets of the same type — sync it everywhere
        setScreens((prev) =>
            prev.map((s) => ({
                ...s,
                widgets: s.widgets.map((w) =>
                    w.id === updatedWidget.id
                        ? updatedWidget
                        : w.widget_type === updatedWidget.widget_type
                          ? { ...w, config: updatedWidget.config }
                          : w
                ),
            }))
        );
        if (selectedWidget) {
            setSelectedWidget({ widget: updatedWidget, screenId });
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
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold leading-tight">Screens</h2>
                    <Button asChild>
                        <Link href={route('screens.create')}>Create Screen</Link>
                    </Button>
                </div>

                <div className="flex gap-6 items-start">

                    <div className="flex-1 min-w-0">
                        {screens.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground mb-4">
                                            Nog geen schermen. Maak je eerste scherm aan!
                                        </p>
                                        <Button asChild>
                                            <Link href={route('screens.create')}>Create Screen</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {screens.map((screen) => {
                                    const isActive = screen.id === activeScreenId;
                                    return (
                                        <Card
                                            key={screen.id}
                                            className={`transition-all cursor-pointer ${
                                                isActive
                                                    ? 'ring-2 ring-primary shadow-lg'
                                                    : 'hover:shadow-md'
                                            }`}
                                            onClick={() => handleSelectScreen(screen.id)}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <CardTitle className="text-base truncate">
                                                            {screen.name}
                                                        </CardTitle>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${
                                                                screen.is_active
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            {screen.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-7 w-7 p-0 ${screen.layout === 'bento_start_small' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                                                            title="Smal links, breed rechts"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLayoutChange(screen.id, 'bento_start_small');
                                                            }}
                                                        >
                                                            <PanelLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-7 w-7 p-0 ${screen.layout === 'bento_start_large' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                                                            title="Breed links, smal rechts"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLayoutChange(screen.id, 'bento_start_large');
                                                            }}
                                                        >
                                                            <PanelRight className="h-4 w-4" />
                                                        </Button>

                                                        <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 flex-shrink-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Opties</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="min-w-36">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('screens.edit', screen.id)}>
                                                                    <Pencil className="h-4 w-4 mr-2" />
                                                                    Bewerken
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(screen.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Verwijderen
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    </div>
                                                </div>

                                                {screen.description && (
                                                    <CardDescription className="text-xs mt-1">
                                                        {screen.description}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>

                                            <CardContent className="pb-2">
                                                {!isActive && screen.widgets.length === 0 && (
                                                    <p className="text-[11px] text-muted-foreground/50 text-center py-2">
                                                        Klik om te selecteren en widgets toe te voegen
                                                    </p>
                                                )}
                                                <ScreenCanvas
                                                    screenId={screen.id}
                                                    widgets={screen.widgets}
                                                    widgetTypes={widgetTypes}
                                                    isScreenActive={isActive}
                                                    layout={screen.layout ?? 'bento_start_small'}
                                                    activeDragWidgetType={activeDragWidgetType}
                                                    onWidgetClick={(widget) => handleWidgetClick(widget, screen.id)}
                                                    onWidgetRemove={(widgetId) => handleWidgetRemove(screen.id, widgetId)}
                                                    selectedWidgetId={
                                                        selectedWidget && selectedWidget.screenId === screen.id
                                                            ? selectedWidget.widget.id
                                                            : null
                                                    }
                                                />
                                            </CardContent>

                                            <CardFooter className="pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link href={route('display.show', screen.id)} target="_blank">
                                                        View Display
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="w-96 flex-shrink-0 sticky top-4 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Widgets</CardTitle>
                                {activeScreenId === null && (
                                    <p className="text-xs text-muted-foreground">
                                        Selecteer een scherm om widgets te slepen
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <WidgetLibraryPanel
                                    widgetTypes={widgetTypes}
                                    onWidgetTypeClick={handleWidgetTypeClick}
                                />
                            </CardContent>
                        </Card>

                        {selectedWidget && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Widget Instellingen</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <WidgetSettingsPanel
                                        widget={selectedWidget.widget}
                                        widgetTypes={widgetTypes}
                                        onClose={() => setSelectedWidget(null)}
                                        onSaved={(updatedWidget) =>
                                            handleWidgetSaved(selectedWidget.screenId, updatedWidget)
                                        }
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeDragLabel ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card shadow-xl opacity-95 pointer-events-none">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{activeDragLabel}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </AppLayout>
    );
}
