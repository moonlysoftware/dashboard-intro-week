import { useState } from 'react';
import axios from 'axios';
import {
    Field,
    TextInput,
    TextArea,
    SaveButton,
    AddButton,
    SectionTitle,
    Divider,
    ImagePreviewPanel,
} from './Ui';

export interface AgendaEventRecord {
    id: number;
    title: string;
    when_label: string;
    when_date?: string | null;
    location?: string;
    tagline?: string;
    accent: string;
    grad?: string;
    photo?: string;
    pos?: string;
}

interface Props {
    events: AgendaEventRecord[];
    onEventsChange: (events: AgendaEventRecord[]) => void;
}

export type EventFormValues = typeof EMPTY_FORM;

const EMPTY_FORM = {
    title: '',
    when_label: '',
    when_date: '',
    location: '',
    tagline: '',
    accent: '#6C52FF',
    grad: '',
    photo: '',
    pos: '',
};

const DUTCH_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const DUTCH_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function formatDutchDateTime(dateStr: string, timeStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const label = `${DUTCH_DAYS[d.getDay()]} ${d.getDate()} ${DUTCH_MONTHS[d.getMonth()]}`;
    return timeStr ? `${label} ${timeStr}` : label;
}

export function EventForm({
    initial,
    onSave,
    onBack,
    saving,
}: {
    initial: Partial<typeof EMPTY_FORM>;
    onSave: (data: typeof EMPTY_FORM) => Promise<void>;
    onBack: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
    const [pickerTime, setPickerTime] = useState('');
    const [labelCustomized, setLabelCustomized] = useState(false);

    const set = (k: keyof typeof EMPTY_FORM, v: string) =>
        setForm((f) => ({ ...f, [k]: v }));

    const handleDateChange = (dateStr: string) => {
        setForm((f) => ({
            ...f,
            when_date: dateStr,
            when_label: labelCustomized ? f.when_label : formatDutchDateTime(dateStr, pickerTime),
        }));
    };

    const handleTimeChange = (timeStr: string) => {
        setPickerTime(timeStr);
        setForm((f) => ({
            ...f,
            when_label: labelCustomized ? f.when_label : formatDutchDateTime(f.when_date ?? '', timeStr),
        }));
    };

    const handleLabelChange = (v: string) => {
        setLabelCustomized(true);
        set('when_label', v);
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-[#6C52FF] hover:underline text-sm font-medium"
                >
                    ← Terug
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5 items-start">
                <div className="space-y-4">
                    <Field label="Titel">
                        <TextInput
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            placeholder="Ibiza Trip"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Datum">
                            <TextInput
                                type="date"
                                value={form.when_date ?? ''}
                                onChange={(e) => handleDateChange(e.target.value)}
                            />
                        </Field>
                        <Field label="Tijdstip" hint="Optioneel">
                            <TextInput
                                type="time"
                                value={pickerTime}
                                onChange={(e) => handleTimeChange(e.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Weergavetekst" hint="Automatisch gegenereerd — pas aan voor bijv. een datumreeks">
                        <TextInput
                            value={form.when_label}
                            onChange={(e) => handleLabelChange(e.target.value)}
                            placeholder="vr 25 sep"
                        />
                    </Field>
                    <Field label="Locatie">
                        <TextInput
                            value={form.location ?? ''}
                            onChange={(e) => set('location', e.target.value)}
                            placeholder="Amsterdam"
                        />
                    </Field>
                    <Field label="Omschrijving">
                        <TextArea
                            value={form.tagline ?? ''}
                            onChange={(e) => set('tagline', e.target.value)}
                            rows={2}
                            placeholder="Korte omschrijving van het evenement…"
                        />
                    </Field>
                    <Divider />
                    <SectionTitle>Stijl</SectionTitle>
                    <Field label="Accentkleur">
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={form.accent}
                                onChange={(e) => set('accent', e.target.value)}
                                className="h-8 w-10 rounded cursor-pointer border border-[#e6e2f4]"
                            />
                            <TextInput
                                value={form.accent}
                                onChange={(e) => set('accent', e.target.value)}
                                className="font-mono"
                                placeholder="#6C52FF"
                            />
                        </div>
                    </Field>
                    <Field label="Gradient (optioneel)" hint="Overschrijft de accentkleur. CSS gradient string.">
                        <TextInput
                            value={form.grad ?? ''}
                            onChange={(e) => set('grad', e.target.value)}
                            placeholder="linear-gradient(140deg,#6C52FF,#FF4490)"
                            className="font-mono text-xs"
                        />
                    </Field>
                </div>

                <ImagePreviewPanel
                    value={form.photo ?? ''}
                    onChange={(url) => set('photo', url)}
                    label="Foto"
                    hint="Achtergrondafbeelding van de evenementkaart."
                />
            </div>

            <div className="pt-2">
                <SaveButton
                    onClick={() => onSave(form)}
                    saving={saving}
                />
            </div>
        </div>
    );
}

// ─── Event card in the grid ───────────────────────────────────────────────────

function EventCard({
    event,
    onEdit,
    onDelete,
}: {
    event: AgendaEventRecord;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const grad = event.grad || `linear-gradient(140deg,${event.accent},${event.accent}88)`;

    return (
        <div className="rounded-2xl border border-[#e6e2f4] bg-white overflow-hidden flex flex-col">
            {/* Thumbnail */}
            <div
                className="relative h-[88px] shrink-0"
                style={{ background: event.photo ? "#0c0a18" : grad }}
            >
                {event.photo && (
                    <img
                        src={event.photo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: event.pos || "center" }}
                    />
                )}
                <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,.55) 100%)" }}
                />
                {event.when_label && (
                    <div className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white/80 leading-none">
                        {event.when_label}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="px-3 pt-2.5 pb-1 flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1a1430] leading-snug truncate">{event.title}</p>
                {event.location && (
                    <p className="text-xs text-[#8b84a8] mt-0.5 truncate">{event.location}</p>
                )}
                {event.tagline && (
                    <p className="text-xs text-[#b0abc8] mt-0.5 truncate">{event.tagline}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-0.5 px-3 pb-2.5 pt-1 border-t border-[#f0eefa] mt-1">
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-lg bg-[#f3f1fb] px-2.5 py-1 text-xs font-semibold text-[#6C52FF] hover:bg-[#6C52FF]/10 transition-colors"
                >
                    Bewerk
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1.5 text-[#b0abc8] hover:text-[#DD2727] transition-colors"
                    title="Verwijder"
                >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgendaManager({ events, onEventsChange }: Props) {
    const [editing, setEditing] = useState<AgendaEventRecord | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async (form: typeof EMPTY_FORM) => {
        setSaving(true);
        try {
            if (editing === 'new') {
                const res = await axios.post(route('agenda-events.store'), form);
                onEventsChange([...events, res.data]);
            } else if (editing) {
                const res = await axios.patch(route('agenda-events.update', editing.id), form);
                onEventsChange(events.map((e) => (e.id === editing.id ? res.data : e)));
            }
            setEditing(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (event: AgendaEventRecord) => {
        if (!confirm(`Evenement "${event.title}" verwijderen?`)) return;
        await axios.delete(route('agenda-events.destroy', event.id));
        onEventsChange(events.filter((e) => e.id !== event.id));
    };

    if (editing !== null) {
        const initial = editing === 'new'
            ? {}
            : {
                title: editing.title,
                when_label: editing.when_label,
                when_date: editing.when_date ?? '',
                location: editing.location ?? '',
                tagline: editing.tagline ?? '',
                accent: editing.accent,
                grad: editing.grad ?? '',
                photo: editing.photo ?? '',
                pos: editing.pos ?? '',
            };

        return (
            <EventForm
                initial={initial}
                onSave={handleSave}
                onBack={() => setEditing(null)}
                saving={saving}
            />
        );
    }

    return (
        <div className="space-y-4">
            {events.length === 0 && (
                <p className="text-center text-sm text-[#8b84a8] py-8">
                    Nog geen evenementen. Voeg er een toe!
                </p>
            )}
            <div className="grid grid-cols-2 gap-3">
                {events.map((event) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => setEditing(event)}
                        onDelete={() => handleDelete(event)}
                    />
                ))}
            </div>
            <AddButton onClick={() => setEditing('new')} label="Evenement toevoegen" />
        </div>
    );
}
