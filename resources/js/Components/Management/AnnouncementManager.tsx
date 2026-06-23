import { useState } from 'react';
import axios from 'axios';
import {
    Field,
    TextInput,
    TextArea,
    SaveButton,
    AddButton,
    Divider,
    Segmented,
    FormWithImagePreview,
} from './Ui';

export interface AnnouncementRecord {
    id: number;
    style: 'split' | 'overlay';
    badge: string | null;
    title: string | null;
    photo: string | null;
    pos: string | null;
    date: string | null;
    time: string | null;
    location: string | null;
    body: string | null;
}

interface Props {
    announcements: AnnouncementRecord[];
    onAnnouncementsChange: (announcements: AnnouncementRecord[]) => void;
}

export type AnnouncementFormValues = {
    style: 'split' | 'overlay';
    badge: string; title: string; photo: string; pos: string;
    date: string; time: string; location: string; body: string;
};

const EMPTY_FORM = {
    style: 'split' as 'split' | 'overlay',
    badge: '',
    title: '',
    photo: '',
    pos: '',
    date: '',
    time: '',
    location: '',
    body: '',
};

function splitTime(time: string | null | undefined): [string, string] {
    if (!time) return ['', ''];
    const parts = time.split(' – ');
    return [parts[0] ?? '', parts[1] ?? ''];
}

export function AnnouncementForm({
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
    const [initFrom, initTo] = splitTime(initial.time);
    const [timeFrom, setTimeFrom] = useState(initFrom);
    const [timeTo, setTimeTo] = useState(initTo);

    const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = () => {
        const combined = timeFrom
            ? timeTo ? `${timeFrom} – ${timeTo}` : timeFrom
            : '';
        onSave({ ...form, time: combined });
    };

    const isSplit = form.style === 'split';

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <button type="button" onClick={onBack} className="text-[#6C52FF] hover:underline text-sm font-medium">
                    ← Terug
                </button>
            </div>

            <FormWithImagePreview
                imageUrl={form.photo ?? ''}
                onImageChange={(url) => set('photo', url)}
                imageHint={isSplit ? 'Wordt rechts getoond met gradient-overgang.' : 'Volledige achtergrond van de slide.'}
            >
                <Field label="Variant">
                    <Segmented
                        options={[
                            { value: 'split', label: 'Tekst + foto' },
                            { value: 'overlay', label: 'Foto overlay' },
                        ]}
                        value={form.style}
                        onChange={(v) => set('style', v as 'split' | 'overlay')}
                    />
                </Field>
                <Divider />
                <Field label="Badge">
                    <TextInput
                        value={form.badge}
                        onChange={(e) => set('badge', e.target.value)}
                        placeholder={isSplit ? 'Moonly Alert' : 'Pieter & Andy'}
                    />
                </Field>
                {isSplit && (
                    <Field label="Titel">
                        <TextInput
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            placeholder="Moonly BBQ"
                        />
                    </Field>
                )}
                {isSplit && (
                    <>
                        <Field label="Datum">
                            <TextInput
                                type="date"
                                value={form.date}
                                onChange={(e) => set('date', e.target.value)}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Tijd van">
                                <TextInput
                                    type="time"
                                    value={timeFrom}
                                    onChange={(e) => setTimeFrom(e.target.value)}
                                />
                            </Field>
                            <Field label="Tijd tot">
                                <TextInput
                                    type="time"
                                    value={timeTo}
                                    onChange={(e) => setTimeTo(e.target.value)}
                                />
                            </Field>
                        </div>
                        <Field label="Locatie">
                            <TextInput
                                value={form.location}
                                onChange={(e) => set('location', e.target.value)}
                                placeholder="Theehuis 't Stroomdal"
                            />
                        </Field>
                    </>
                )}
                <Field label="Tekst" hint={!isSplit ? 'Gebruik een lege regel voor meerdere alinea\'s.' : undefined}>
                    <TextArea
                        value={form.body}
                        onChange={(e) => set('body', e.target.value)}
                        rows={isSplit ? 4 : 6}
                        placeholder={isSplit ? 'Aanvullende omschrijving…' : "Eerste alinea…\n\nTweede alinea…"}
                    />
                </Field>
            </FormWithImagePreview>

            <div className="pt-2">
                <SaveButton onClick={handleSubmit} saving={saving} />
            </div>
        </div>
    );
}

function AnnouncementCard({
    announcement,
    onEdit,
    onDelete,
}: {
    announcement: AnnouncementRecord;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const isOverlay = announcement.style === 'overlay';
    return (
        <div className="rounded-2xl border border-[#e6e2f4] bg-white overflow-hidden flex flex-col">
            {/* Thumbnail */}
            <div
                className="relative h-[88px] shrink-0"
                style={{ background: announcement.photo ? '#08060f' : 'linear-gradient(135deg,#3a1f6e,#6C1F8E)' }}
            >
                {announcement.photo && (
                    <img
                        src={announcement.photo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: announcement.pos || 'center' }}
                    />
                )}
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg,transparent 30%,rgba(0,0,0,.55) 100%)' }}
                />
                <div className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white/70 uppercase tracking-wide leading-none">
                    {isOverlay ? 'Foto overlay' : 'Tekst + foto'}
                </div>
            </div>

            {/* Info */}
            <div className="px-3 pt-2.5 pb-1 flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1a1430] leading-snug truncate">
                    {announcement.title || announcement.badge || 'Naamloos'}
                </p>
                <p className="text-xs text-[#8b84a8] mt-0.5 truncate">
                    {[announcement.badge, announcement.date, announcement.location].filter(Boolean).join(' · ') || 'Geen details'}
                </p>
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

export function AnnouncementManager({ announcements, onAnnouncementsChange }: Props) {
    const [editing, setEditing] = useState<AnnouncementRecord | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async (form: typeof EMPTY_FORM) => {
        setSaving(true);
        try {
            if (editing === 'new') {
                const res = await axios.post(route('announcements.store'), form);
                onAnnouncementsChange([res.data, ...announcements]);
            } else if (editing) {
                const res = await axios.patch(route('announcements.update', editing.id), form);
                onAnnouncementsChange(announcements.map((a) => (a.id === editing.id ? res.data : a)));
            }
            setEditing(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (announcement: AnnouncementRecord) => {
        if (!confirm(`Aankondiging "${announcement.title || announcement.badge || 'Naamloos'}" verwijderen?`)) return;
        await axios.delete(route('announcements.destroy', announcement.id));
        onAnnouncementsChange(announcements.filter((a) => a.id !== announcement.id));
    };

    if (editing !== null) {
        const initial = editing === 'new'
            ? {}
            : {
                style: editing.style,
                badge: editing.badge ?? '',
                title: editing.title ?? '',
                photo: editing.photo ?? '',
                pos: editing.pos ?? '',
                date: editing.date ?? '',
                time: editing.time ?? '',
                location: editing.location ?? '',
                body: editing.body ?? '',
            };

        return (
            <AnnouncementForm
                initial={initial}
                onSave={handleSave}
                onBack={() => setEditing(null)}
                saving={saving}
            />
        );
    }

    return (
        <div className="space-y-4">
            {announcements.length === 0 && (
                <p className="text-center text-sm text-[#8b84a8] py-8">
                    Nog geen aankondigingen. Voeg er een toe!
                </p>
            )}
            <div className="grid grid-cols-2 gap-3">
                {announcements.map((announcement) => (
                    <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onEdit={() => setEditing(announcement)}
                        onDelete={() => handleDelete(announcement)}
                    />
                ))}
            </div>
            <AddButton onClick={() => setEditing('new')} label="Aankondiging toevoegen" />
        </div>
    );
}
