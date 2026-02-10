import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { PageProps } from '@/types';
import axios from 'axios';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';

interface RoomConfig {
    name: string;
    calendar_id: string;
}

interface Widget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
}

interface Screen {
    id: number;
    name: string;
    description: string | null;
    refresh_interval: number;
    is_active: boolean;
    widgets: Widget[];
}

interface EditProps extends PageProps {
    screen: Screen;
    widgetTypes: Record<string, string>;
}

export default function Edit({ auth, screen, widgetTypes }: EditProps) {
    const [widgets, setWidgets] = useState<Widget[]>(screen.widgets);
    const [showAddWidget, setShowAddWidget] = useState(false);
    const [newWidget, setNewWidget] = useState({
        widget_type: 'birthday',
        grid_col_span: 6,
        grid_row_span: 1,
        grid_order: widgets.length,
        config: {} as Record<string, any>,
    });
    const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([
        { name: '', calendar_id: '' },
    ]);

    const handleWidgetTypeChange = (type: string) => {
        setNewWidget({ ...newWidget, widget_type: type, config: {} });
        if (type === 'room_availability') {
            setRoomConfigs([{ name: '', calendar_id: '' }]);
        }
    };

    const handleRoomChange = (index: number, field: keyof RoomConfig, value: string) => {
        const updated = roomConfigs.map((r, i) =>
            i === index ? { ...r, [field]: value } : r
        );
        setRoomConfigs(updated);
        setNewWidget({
            ...newWidget,
            config: { rooms: updated.filter(r => r.name || r.calendar_id) },
        });
    };

    const handleAddRoom = () => {
        setRoomConfigs([...roomConfigs, { name: '', calendar_id: '' }]);
    };

    const handleRemoveRoom = (index: number) => {
        const updated = roomConfigs.filter((_, i) => i !== index);
        setRoomConfigs(updated);
        setNewWidget({
            ...newWidget,
            config: { rooms: updated.filter(r => r.name || r.calendar_id) },
        });
    };

    const { data, setData, patch, processing, errors } = useForm({
        name: screen.name,
        description: screen.description || '',
        refresh_interval: screen.refresh_interval,
        is_active: screen.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('screens.update', screen.id));
    };

    const handleAddWidget = async () => {
        try {
            const response = await axios.post(route('widgets.store', screen.id), newWidget);
            setWidgets([...widgets, response.data]);
            setShowAddWidget(false);
            setNewWidget({
                widget_type: 'birthday',
                grid_col_span: 6,
                grid_row_span: 1,
                grid_order: widgets.length + 1,
                config: {},
            });
            setRoomConfigs([{ name: '', calendar_id: '' }]);
        } catch (error) {
            console.error('Error adding widget:', error);
        }
    };

    const handleDeleteWidget = async (widgetId: number) => {
        if (confirm('Are you sure you want to delete this widget?')) {
            try {
                await axios.delete(route('widgets.destroy', widgetId));
                setWidgets(widgets.filter(w => w.id !== widgetId));
            } catch (error) {
                console.error('Error deleting widget:', error);
            }
        }
    };

    const getWidgetTypeName = (type: string) => {
        return widgetTypes[type] || type;
    };

    return (
        <AppLayout>
            <Head title={`Edit Screen: ${screen.name}`} />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold leading-tight">
                    Edit Screen: {screen.name}
                </h2>
                <Button variant="ghost" asChild>
                    <Link href={route('screens.index')}>
                        Back to Screens
                    </Link>
                </Button>
            </div>

            <div className="space-y-6">
                    {/* Screen Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Screen Settings</CardTitle>
                            <CardDescription>
                                Configure the basic settings for this display screen
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Screen Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <textarea
                                        id="description"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="refresh_interval">Refresh Interval (seconds)</Label>
                                    <Input
                                        id="refresh_interval"
                                        type="number"
                                        min="5"
                                        max="300"
                                        value={data.refresh_interval}
                                        onChange={(e) => setData('refresh_interval', parseInt(e.target.value))}
                                        required
                                    />
                                    {errors.refresh_interval && (
                                        <p className="text-sm text-destructive">{errors.refresh_interval}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>

                                <Button type="submit" disabled={processing}>
                                    Update Screen
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Widgets Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Widgets</CardTitle>
                                    <CardDescription>
                                        Manage the widgets displayed on this screen
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setShowAddWidget(!showAddWidget)}>
                                    {showAddWidget ? 'Cancel' : 'Add Widget'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showAddWidget && (
                                <Card className="mb-6 border-dashed">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Add New Widget</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="widget_type">Widget Type</Label>
                                                <select
                                                    id="widget_type"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                                    value={newWidget.widget_type}
                                                    onChange={(e) => handleWidgetTypeChange(e.target.value)}
                                                >
                                                    {Object.entries(widgetTypes).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="col_span">Column Span (1-12)</Label>
                                                <Input
                                                    id="col_span"
                                                    type="number"
                                                    min="1"
                                                    max="12"
                                                    value={newWidget.grid_col_span}
                                                    onChange={(e) => setNewWidget({ ...newWidget, grid_col_span: parseInt(e.target.value) })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="row_span">Row Span</Label>
                                                <Input
                                                    id="row_span"
                                                    type="number"
                                                    min="1"
                                                    max="6"
                                                    value={newWidget.grid_row_span}
                                                    onChange={(e) => setNewWidget({ ...newWidget, grid_row_span: parseInt(e.target.value) })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="order">Order</Label>
                                                <Input
                                                    id="order"
                                                    type="number"
                                                    min="0"
                                                    value={newWidget.grid_order}
                                                    onChange={(e) => setNewWidget({ ...newWidget, grid_order: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        {/* Ruimte Beschikbaarheid configuratie */}
                                        {newWidget.widget_type === 'room_availability' && (
                                            <div className="mt-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base font-semibold">Ruimtes configureren</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleAddRoom}
                                                    >
                                                        + Ruimte toevoegen
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Voeg de Google Calendar ID toe van elke ruimte. Deel de agenda met{' '}
                                                    <code className="bg-muted px-1 rounded text-xs">calendar@internship-2026.iam.gserviceaccount.com</code>
                                                </p>
                                                {roomConfigs.map((room, index) => (
                                                    <div key={index} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Naam ruimte</Label>
                                                            <Input
                                                                placeholder="bijv. Vergaderzaal A"
                                                                value={room.name}
                                                                onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Google Calendar ID</Label>
                                                            <Input
                                                                placeholder="bijv. abc123@group.calendar.google.com"
                                                                value={room.calendar_id}
                                                                onChange={(e) => handleRoomChange(index, 'calendar_id', e.target.value)}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleRemoveRoom(index)}
                                                            disabled={roomConfigs.length === 1}
                                                        >
                                                            &times;
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <Button onClick={handleAddWidget}>
                                                Add Widget
                                            </Button>
                                            <Button variant="outline" onClick={() => setShowAddWidget(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {widgets.length === 0 ? (
                                <div className="text-center py-12 border border-dashed rounded-lg">
                                    <p className="text-muted-foreground mb-4">
                                        No widgets yet. Add your first widget!
                                    </p>
                                    <Button onClick={() => setShowAddWidget(true)}>
                                        Add Widget
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {widgets.map((widget) => (
                                        <Card key={widget.id}>
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div>
                                                    <h4 className="font-semibold">
                                                        {getWidgetTypeName(widget.widget_type)}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Cols: {widget.grid_col_span} | Rows: {widget.grid_row_span} | Order: {widget.grid_order}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteWidget(widget.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Link */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Display Preview</CardTitle>
                            <CardDescription>
                                Open this link on your physical display screens
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" asChild>
                                <Link href={route('display.show', screen.id)} target="_blank">
                                    Open Display View
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
        </AppLayout>
    );
}
