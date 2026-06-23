import { useEffect, useState } from 'react';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';
import { Field, TextInput, RowCard, AddButton, SaveButton, SectionTitle } from './Ui';

interface RoomConfig {
    id?: string;
    name: string;
    calendar_id?: string;
    subtext?: string;
}

interface LegacyRoom {
    name?: string;
    calendar_id?: string;
    subtext?: string;
}

interface Props {
    rooms: RoomConfig[];
    legacyRooms?: LegacyRoom[];
    calendarConfigured?: boolean;
    onRoomsChange: (rooms: RoomConfig[]) => void;
}

export function OverlayEditor({ rooms: initialRooms, legacyRooms, calendarConfigured = false, onRoomsChange }: Props) {
    const [rooms, setRooms] = useState<RoomConfig[]>(initialRooms);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setRooms(initialRooms);
    }, [initialRooms]);

    useEffect(() => {
        if (rooms.length > 0 || !legacyRooms?.length) return;
        setRooms(
            legacyRooms.map((r, i) => ({
                id: `room-${i}`,
                name: r.name ?? '',
                calendar_id: r.calendar_id ?? '',
                subtext: r.subtext ?? '',
            })),
        );
    }, [legacyRooms]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(route('overlay.update'), { rooms });
            onRoomsChange(res.data.rooms);
            notifyDisplayRefresh('all');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const addRoom = () =>
        setRooms([...rooms, {
            id: `room-${Date.now()}`,
            name: '',
            calendar_id: '',
        }]);

    const update = (i: number, p: Partial<RoomConfig>) =>
        setRooms(rooms.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

    const remove = (i: number) => setRooms(rooms.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-5 max-w-2xl">
            <SectionTitle>Overlay — Vergaderruimtes</SectionTitle>
            <p className="text-sm text-[#5b5478]">
                Deze ruimtes worden onderaan getoond op alle <strong>Slideshow</strong> en{' '}
                <strong>Statisch</strong> displays. Configureer ze hier één keer — niet per scherm.
            </p>
            <p className="text-xs text-[#8b84a8]">
                Deel elke agenda met{' '}
                <code className="rounded bg-[#f3f1fb] px-1.5 py-0.5 font-mono text-[11px]">
                    calendar@internship-2026.iam.gserviceaccount.com
                </code>
            </p>
            {!calendarConfigured && (
                <div className="rounded-xl border border-[#FFC53D]/40 bg-[#FFC53D]/10 px-4 py-3 text-sm text-[#7a5c00]">
                    <strong>Google Calendar niet gekoppeld.</strong> Plaats het service-account bestand als{' '}
                    <code className="font-mono text-xs">googlecloud-account.json</code> in de projectroot
                    (of stel <code className="font-mono text-xs">GOOGLE_APPLICATION_CREDENTIALS</code> in via{' '}
                    <code className="font-mono text-xs">.env</code>). Zonder dit bestand tonen displays
                    &quot;Geen data&quot; i.p.v. echte beschikbaarheid.
                </div>
            )}

            <div className="space-y-3">
                {rooms.map((room, i) => (
                    <RowCard key={i} onDelete={() => remove(i)}>
                        <Field label="Naam">
                            <TextInput
                                value={room.name}
                                onChange={(e) => update(i, { name: e.target.value })}
                                placeholder="Meeting Room 1"
                            />
                        </Field>
                        <Field label="Google Calendar ID" hint="Bijv. abc123@group.calendar.google.com">
                            <TextInput
                                value={room.calendar_id ?? ''}
                                onChange={(e) => update(i, { calendar_id: e.target.value })}
                                placeholder="abc123@group.calendar.google.com"
                                className="font-mono text-xs"
                            />
                        </Field>
                        {!room.calendar_id && (
                            <Field label="Ondertitel (handmatig)" hint="Alleen zichtbaar zonder gekoppelde agenda">
                                <TextInput
                                    value={room.subtext ?? ''}
                                    onChange={(e) => update(i, { subtext: e.target.value })}
                                    placeholder="3e verdieping"
                                />
                            </Field>
                        )}
                    </RowCard>
                ))}
            </div>

            <AddButton onClick={addRoom} label="Ruimte toevoegen" />

            <div className="pt-2">
                <SaveButton onClick={save} saving={saving} saved={saved} />
            </div>
        </div>
    );
}
