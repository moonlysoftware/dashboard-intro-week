import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import axios from 'axios';
import type { Widget } from './ScreenCanvas';

interface RoomConfig {
    name: string;
    calendar_id: string;
}

interface WidgetSettingsPanelProps {
    widget: Widget;
    widgetTypes: Record<string, string>;
    onClose: () => void;
    onSaved: (updatedWidget: Widget) => void;
}

export function WidgetSettingsPanel({ widget, widgetTypes, onClose, onSaved }: WidgetSettingsPanelProps) {
    const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>(
        widget.config?.rooms?.length
            ? widget.config.rooms
            : [{ name: '', calendar_id: '' }]
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const finalConfig =
                widget.widget_type === 'room_availability'
                    ? { rooms: roomConfigs.filter((r) => r.name || r.calendar_id) }
                    : widget.config;

            const response = await axios.patch(route('widgets.update', widget.id), {
                config: finalConfig,
            });

            onSaved(response.data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving widget config:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRoomChange = (index: number, field: keyof RoomConfig, value: string) => {
        setRoomConfigs(roomConfigs.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const handleAddRoom = () => {
        setRoomConfigs([...roomConfigs, { name: '', calendar_id: '' }]);
    };

    const handleRemoveRoom = (index: number) => {
        setRoomConfigs(roomConfigs.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-7 w-7 p-0 flex-shrink-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold text-sm truncate">
                    {widgetTypes[widget.widget_type] || widget.widget_type}
                </h3>
            </div>

            {widget.widget_type === 'room_availability' && (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Deel de agenda met{' '}
                        <code className="bg-muted px-1 rounded text-[10px]">
                            calendar@internship-2026.iam.gserviceaccount.com
                        </code>
                    </p>
                    {roomConfigs.map((room, index) => (
                        <div key={index} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                            <div className="space-y-1">
                                <Label className="text-xs">Naam ruimte</Label>
                                <Input
                                    placeholder="bijv. Vergaderzaal A"
                                    value={room.name}
                                    onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Google Calendar ID</Label>
                                <Input
                                    placeholder="abc123@group.calendar.google.com"
                                    value={room.calendar_id}
                                    onChange={(e) =>
                                        handleRoomChange(index, 'calendar_id', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                            {roomConfigs.length > 1 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                    onClick={() => handleRemoveRoom(index)}
                                >
                                    Verwijder ruimte
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={handleAddRoom}
                    >
                        + Ruimte toevoegen
                    </Button>
                </div>
            )}

            {widget.widget_type !== 'room_availability' && (
                <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        Geen instellingen beschikbaar voor dit widget type.
                    </p>
                </div>
            )}

            {widget.widget_type === 'room_availability' && (
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                    size="sm"
                    variant={saved ? 'outline' : 'default'}
                >
                    {saving ? 'Opslaan...' : saved ? 'Opgeslagen!' : 'Opslaan'}
                </Button>
            )}
        </div>
    );
}
