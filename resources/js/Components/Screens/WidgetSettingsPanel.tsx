import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pencil, Trash2, Upload } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import axios from 'axios';
import type { Widget } from './ScreenCanvas';

interface RoomConfig {
    name: string;
    calendar_id: string;
}

interface AnnouncementConfig {
    title: string;
    message: string;
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
    const [announcementConfigs, setAnnouncementConfigs] = useState<AnnouncementConfig[]>(
        widget.config?.announcements?.length
            ? widget.config.announcements
            : [{ title: '', message: '' }]
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // --- Image widget state ---
    const [allImages, setAllImages] = useState<{ url: string; filename: string }[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>(
        widget.config?.selected_images ?? []
    );
    const [transitionTime, setTransitionTime] = useState<number>(
        widget.config?.transition_time ?? 5
    );
    const [imagePositions, setImagePositions] = useState<Record<string, number>>(
        widget.config?.image_positions ?? {}
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const popoverOpenRef = useRef(false);

    useEffect(() => {
        if (widget.widget_type !== 'image_widget') return;
        axios.get(route('image-widget.index')).then((res) => setAllImages(res.data));
    }, [widget.widget_type]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await axios.post(route('image-widget.store'), formData);
            setAllImages((prev) => [...prev, res.data]);
        } catch (err: any) {
            const msg: string =
                err.response?.data?.errors?.image?.[0] ??
                err.response?.data?.message ??
                'Upload mislukt.';
            setUploadError(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePositionChange = (url: string, value: number) => {
        const clamped = Math.max(0, Math.min(100, value));
        setImagePositions((prev) => ({ ...prev, [url]: clamped }));
    };

    const handleDeleteImage = async (filename: string, url: string) => {
        await axios.delete(route('image-widget.destroy', { filename }));
        setAllImages((prev) => prev.filter((img) => img.filename !== filename));
        setSelectedImages((prev) => prev.filter((u) => u !== url));
        setImagePositions((prev) => {
            const next = { ...prev };
            delete next[url];
            return next;
        });
    };

    const toggleImageSelection = (url: string) => {
        setSelectedImages((prev) =>
            prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
        );
    };
    // --- End image widget state ---

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            let finalConfig: Record<string, any>;
            if (widget.widget_type === 'room_availability') {
                finalConfig = { rooms: roomConfigs.filter((r) => r.name || r.calendar_id) };
            } else if (widget.widget_type === 'image_widget') {
                finalConfig = { selected_images: selectedImages, transition_time: transitionTime, image_positions: imagePositions };
            } else if (widget.widget_type === 'announcements') {
                finalConfig = { announcements: announcementConfigs.filter((a) => a.title || a.message) };
            } else {
                finalConfig = widget.config ?? {};
            }

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

    const handleAnnouncementChange = (index: number, field: keyof AnnouncementConfig, value: string) => {
        setAnnouncementConfigs(announcementConfigs.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    };

    const handleAddAnnouncement = () => {
        setAnnouncementConfigs([...announcementConfigs, { title: '', message: '' }]);
    };

    const handleRemoveAnnouncement = (index: number) => {
        setAnnouncementConfigs(announcementConfigs.filter((_, i) => i !== index));
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

            {widget.widget_type === 'image_widget' && (
                <div className="space-y-4">
                    {/* Upload button */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-3 w-3 mr-1" />
                            {uploading ? 'Uploaden...' : 'Afbeelding uploaden'}
                        </Button>
                        {uploadError && (
                            <p className="text-xs text-destructive mt-1">{uploadError}</p>
                        )}
                    </div>

                    {/* Image grid */}
                    {allImages.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            Nog geen afbeeldingen geüpload.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {allImages.map((img) => {
                                const isSelected = selectedImages.includes(img.url);
                                return (
                                    <div
                                        key={img.filename}
                                        className={`relative rounded-md overflow-hidden border-2 cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'border-primary'
                                                : 'border-transparent'
                                        }`}
                                        onClick={() => {
                                            if (popoverOpenRef.current) return;
                                            toggleImageSelection(img.url);
                                        }}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.filename}
                                            className="w-full h-16 object-cover"
                                        />
                                        {isSelected && (
                                            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-[9px] text-primary-foreground font-bold">✓</span>
                                            </div>
                                        )}
                                        {isSelected && (
                                            <Popover onOpenChange={(open) => {
                                                if (open) {
                                                    popoverOpenRef.current = true;
                                                } else {
                                                    setTimeout(() => { popoverOpenRef.current = false; }, 200);
                                                }
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center opacity-80 hover:opacity-100"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                    >
                                                        <Pencil className="h-3 w-3 text-primary-foreground" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-52 p-3 space-y-2" side="top">
                                                    <p className="text-xs font-medium">Verticale positie</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        0% = boven, 50% = midden, 100% = onder
                                                    </p>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={imagePositions[img.url] ?? 0}
                                                        onChange={(e) => handlePositionChange(img.url, Number(e.target.value))}
                                                        className="h-7 text-xs"
                                                    />
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 h-6 text-[10px]"
                                                            onClick={() => handlePositionChange(img.url, 0)}
                                                        >
                                                            Boven
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 h-6 text-[10px]"
                                                            onClick={() => handlePositionChange(img.url, 50)}
                                                        >
                                                            Midden
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 h-6 text-[10px]"
                                                            onClick={() => handlePositionChange(img.url, 100)}
                                                        >
                                                            Onder
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        <button
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-80 hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage(img.filename, img.url);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3 text-destructive-foreground" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Transition time */}
                    <div className="space-y-1">
                        <Label className="text-xs">Transitietijd (seconden)</Label>
                        <Input
                            type="number"
                            min={1}
                            max={60}
                            value={transitionTime}
                            onChange={(e) => setTransitionTime(Number(e.target.value))}
                            className="h-8 text-sm"
                            disabled={selectedImages.length < 2}
                        />
                        {selectedImages.length < 2 && (
                            <p className="text-[10px] text-muted-foreground">
                                Selecteer minimaal 2 afbeeldingen om de transitietijd in te stellen.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {widget.widget_type === 'announcements' && (
                <div className="space-y-3">
                    {announcementConfigs.map((announcement, index) => (
                        <div key={index} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                            <div className="space-y-1">
                                <Label className="text-xs">Titel</Label>
                                <Input
                                    placeholder="bijv. Team Lunch"
                                    value={announcement.title}
                                    onChange={(e) => handleAnnouncementChange(index, 'title', e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Bericht</Label>
                                <Input
                                    placeholder="bijv. Vergeet de team lunch niet om 12:30!"
                                    value={announcement.message}
                                    onChange={(e) => handleAnnouncementChange(index, 'message', e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            {announcementConfigs.length > 1 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                    onClick={() => handleRemoveAnnouncement(index)}
                                >
                                    Verwijder mededeling
                                </Button>
                            )}
                        </div>
                    ))}
                    {announcementConfigs.length < 5 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={handleAddAnnouncement}
                        >
                            + Mededeling toevoegen
                        </Button>
                    )}
                </div>
            )}

            {widget.widget_type !== 'room_availability' && widget.widget_type !== 'image_widget' && widget.widget_type !== 'announcements' && (
                <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        Geen instellingen beschikbaar voor dit widget type.
                    </p>
                </div>
            )}

            {(widget.widget_type === 'room_availability' || widget.widget_type === 'image_widget' || widget.widget_type === 'announcements') && (
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
