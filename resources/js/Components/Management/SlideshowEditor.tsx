import { useState } from 'react';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';
import {
    Field, TextInput, TextArea, NumberInput, Toggle,
    Segmented, RowCard, AddButton, SaveButton, SectionTitle, Divider, ImageUploadField,
} from './Ui';

interface SlideWidget {
    id: number;
    widget_type: 'agenda' | 'birthdays' | 'appreciation' | 'announcement';
    grid_order: number;
    config: Record<string, any> | null;
}

interface Props {
    screenId: number;
    slides: SlideWidget[];
    onSlidesChange: (slides: SlideWidget[]) => void;
}

const SLIDE_META: Record<string, { label: string; icon: string; defaultConfig: Record<string, any> }> = {
    agenda: {
        label: 'Agenda',
        icon: '📅',
        defaultConfig: { _enabled: true, layout: 'featured', events: [] },
    },
    birthdays: {
        label: 'Verjaardagen',
        icon: '🎂',
        defaultConfig: { _enabled: true, layout: 'featured', list: [] },
    },
    appreciation: {
        label: 'Klantwaardering',
        icon: '⭐',
        defaultConfig: { _enabled: true, layout: 'grid', style: 'review', items: [] },
    },
    announcement: {
        label: 'Aankondiging',
        icon: '📢',
        defaultConfig: {
            _enabled: true,
            style: 'split',
            badge: '',
            title: '',
            date: '',
            time: '',
            location: '',
            body: '',
            photo: '',
        },
    },
};

// ─── Per-slide content editors ────────────────────────────────────────────────

function AgendaEditor({ cfg, onChange }: { cfg: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    const events: any[] = cfg.events ?? [];

    const setEvents = (ev: any[]) => onChange({ ...cfg, events: ev });

    const addEvent = () =>
        setEvents([...events, { title: '', when: '', where: '', accent: '#6C52FF', photo: '' }]);

    const updateEvent = (i: number, patch: Record<string, any>) =>
        setEvents(events.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

    const removeEvent = (i: number) => setEvents(events.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            <Field label="Lay-out">
                <Segmented
                    options={[
                        { value: 'featured', label: 'Uitgelicht' },
                        { value: 'grid', label: 'Grid' },
                        { value: 'list', label: 'Lijst' },
                    ]}
                    value={cfg.layout ?? 'featured'}
                    onChange={(v) => onChange({ ...cfg, layout: v })}
                />
            </Field>
            <Divider />
            <SectionTitle>Evenementen</SectionTitle>
            <div className="space-y-3">
                {events.map((ev, i) => (
                    <RowCard key={i} onDelete={() => removeEvent(i)}>
                        <Field label="Titel">
                            <TextInput
                                value={ev.title}
                                onChange={(e) => updateEvent(i, { title: e.target.value })}
                                placeholder="Teammeeting"
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Wanneer">
                                <TextInput
                                    value={ev.when}
                                    onChange={(e) => updateEvent(i, { when: e.target.value })}
                                    placeholder="Ma 14:00"
                                />
                            </Field>
                            <Field label="Waar">
                                <TextInput
                                    value={ev.where}
                                    onChange={(e) => updateEvent(i, { where: e.target.value })}
                                    placeholder="Room 3"
                                />
                            </Field>
                        </div>
                        <Field label="Accentkleur">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={ev.accent ?? '#6C52FF'}
                                    onChange={(e) => updateEvent(i, { accent: e.target.value })}
                                    className="h-8 w-10 rounded cursor-pointer border border-[#e6e2f4]"
                                />
                                <TextInput
                                    value={ev.accent ?? '#6C52FF'}
                                    onChange={(e) => updateEvent(i, { accent: e.target.value })}
                                    className="font-mono"
                                />
                            </div>
                        </Field>
                        <ImageUploadField
                            value={ev.photo ?? ''}
                            onChange={(url) => updateEvent(i, { photo: url })}
                            hint="Wordt als achtergrond op de agenda-kaart getoond. Zonder afbeelding wordt de accentkleur gebruikt."
                        />
                    </RowCard>
                ))}
            </div>
            <AddButton onClick={addEvent} label="Evenement toevoegen" />
        </div>
    );
}

function BirthdaysEditor({ cfg, onChange }: { cfg: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    const list: any[] = cfg.list ?? [];

    const setList = (l: any[]) => onChange({ ...cfg, list: l });

    const add = () => setList([...list, { name: '', date: '', photo: '' }]);
    const update = (i: number, patch: Record<string, any>) =>
        setList(list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
    const remove = (i: number) => setList(list.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            <Field label="Lay-out">
                <Segmented
                    options={[
                        { value: 'featured', label: 'Uitgelicht' },
                        { value: 'grid', label: 'Grid' },
                    ]}
                    value={cfg.layout ?? 'featured'}
                    onChange={(v) => onChange({ ...cfg, layout: v })}
                />
            </Field>
            <Divider />
            <SectionTitle>Jarigen</SectionTitle>
            <div className="space-y-3">
                {list.map((p, i) => (
                    <RowCard key={i} onDelete={() => remove(i)}>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Naam">
                                <TextInput
                                    value={p.name}
                                    onChange={(e) => update(i, { name: e.target.value })}
                                    placeholder="Jan de Vries"
                                />
                            </Field>
                            <Field label="Datum">
                                <TextInput
                                    value={p.date}
                                    onChange={(e) => update(i, { date: e.target.value })}
                                    placeholder="19 jun"
                                />
                            </Field>
                        </div>
                    </RowCard>
                ))}
            </div>
            <AddButton onClick={add} label="Jarige toevoegen" />
        </div>
    );
}

function AppreciationEditor({ cfg, onChange }: { cfg: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    const items: any[] = cfg.items ?? [];

    const setItems = (it: any[]) => onChange({ ...cfg, items: it });
    const add = () => setItems([...items, { author: '', stars: 5, text: '' }]);
    const update = (i: number, patch: Record<string, any>) =>
        setItems(items.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
    const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Field label="Lay-out">
                    <Segmented
                        options={[
                            { value: 'grid', label: 'Grid' },
                            { value: 'spotlight', label: 'Spotlight' },
                            { value: 'list', label: 'Lijst' },
                        ]}
                        value={cfg.layout ?? 'grid'}
                        onChange={(v) => onChange({ ...cfg, layout: v })}
                    />
                </Field>
                <Field label="Stijl">
                    <Segmented
                        options={[
                            { value: 'review', label: 'Review' },
                            { value: 'chat', label: 'Chat' },
                        ]}
                        value={cfg.style ?? 'review'}
                        onChange={(v) => onChange({ ...cfg, style: v })}
                    />
                </Field>
            </div>
            <Divider />
            <SectionTitle>Beoordelingen</SectionTitle>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <RowCard key={i} onDelete={() => remove(i)}>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Auteur">
                                <TextInput
                                    value={item.author}
                                    onChange={(e) => update(i, { author: e.target.value })}
                                    placeholder="Maria K."
                                />
                            </Field>
                            <Field label="Sterren (1–5)">
                                <NumberInput
                                    value={item.stars ?? 5}
                                    onChange={(e) => update(i, { stars: Number(e.target.value) })}
                                    min={1}
                                    max={5}
                                />
                            </Field>
                        </div>
                        <Field label="Tekst">
                            <TextArea
                                value={item.text}
                                onChange={(e) => update(i, { text: e.target.value })}
                                rows={2}
                                placeholder="Geweldige service!"
                            />
                        </Field>
                    </RowCard>
                ))}
            </div>
            <AddButton onClick={add} label="Beoordeling toevoegen" />
        </div>
    );
}

function AnnouncementEditor({ cfg, onChange }: { cfg: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    const isSplit = (cfg.style ?? 'split') === 'split';

    const setDetails = (patch: Record<string, string>) => onChange({ ...cfg, ...patch });

    return (
        <div className="space-y-4">
            <Field label="Variant">
                <Segmented
                    options={[
                        { value: 'split', label: 'Tekst + foto' },
                        { value: 'overlay', label: 'Foto overlay' },
                    ]}
                    value={cfg.style ?? 'split'}
                    onChange={(v) => onChange({ ...cfg, style: v })}
                />
            </Field>
            <p className="text-xs text-[#8b84a8]">
                {isSplit
                    ? 'Tekst links, foto rechts — met titel en details (datum, tijd, locatie).'
                    : 'Volledige achtergrondfoto met badge en tekst linksonder.'}
            </p>
            <Divider />
            <Field label="Badge">
                <TextInput
                    value={cfg.badge ?? ''}
                    onChange={(e) => onChange({ ...cfg, badge: e.target.value })}
                    placeholder={isSplit ? 'Moonly Alert' : 'Pieter Pot & Andy'}
                />
            </Field>
            {isSplit && (
                <Field label="Titel">
                    <TextInput
                        value={cfg.title ?? ''}
                        onChange={(e) => onChange({ ...cfg, title: e.target.value })}
                        placeholder="Moonly BBQ"
                    />
                </Field>
            )}
            {isSplit && (
                <div className="grid grid-cols-1 gap-3">
                    <Field label="Datum">
                        <TextInput
                            value={cfg.date ?? ''}
                            onChange={(e) => setDetails({ date: e.target.value })}
                            placeholder="18 juli 2026"
                        />
                    </Field>
                    <Field label="Tijd">
                        <TextInput
                            value={cfg.time ?? ''}
                            onChange={(e) => setDetails({ time: e.target.value })}
                            placeholder="17:00 – 21:00"
                        />
                    </Field>
                    <Field label="Locatie">
                        <TextInput
                            value={cfg.location ?? ''}
                            onChange={(e) => setDetails({ location: e.target.value })}
                            placeholder="Theehuis 't Stroomdal"
                        />
                    </Field>
                </div>
            )}
            <Field label="Tekst" hint="Gebruik een lege regel voor meerdere alinea's (overlay-variant).">
                <TextArea
                    value={cfg.body ?? ''}
                    onChange={(e) => onChange({ ...cfg, body: e.target.value })}
                    rows={isSplit ? 4 : 6}
                    placeholder={
                        isSplit
                            ? 'Aanvullende omschrijving…'
                            : 'Eerste alinea…\n\nTweede alinea…'
                    }
                />
            </Field>
            <ImageUploadField
                value={cfg.photo ?? ''}
                onChange={(url) => onChange({ ...cfg, photo: url })}
                hint={isSplit ? 'Wordt rechts getoond met gradient-overgang.' : 'Volledige achtergrond van de slide.'}
            />
        </div>
    );
}

function SlideEditor({
    slide,
    screenId,
    onSave,
    onBack,
}: {
    slide: SlideWidget;
    screenId: number;
    onSave: (slide: SlideWidget) => void;
    onBack: () => void;
}) {
    const [cfg, setCfg] = useState<Record<string, any>>(slide.config ?? SLIDE_META[slide.widget_type]?.defaultConfig ?? {});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const meta = SLIDE_META[slide.widget_type];

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(route('widgets.update', slide.id), { config: cfg });
            onSave({ ...slide, config: res.data.config });
            notifyDisplayRefresh(screenId);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const EditorComponent =
        slide.widget_type === 'agenda' ? AgendaEditor :
        slide.widget_type === 'birthdays' ? BirthdaysEditor :
        slide.widget_type === 'appreciation' ? AppreciationEditor :
        AnnouncementEditor;

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
                <span className="text-[#b0abc8] text-sm">/</span>
                <span className="text-sm font-semibold text-[#1a1430]">
                    {meta?.icon} {meta?.label}
                </span>
            </div>

            <EditorComponent cfg={cfg} onChange={setCfg} />

            <div className="pt-2">
                <SaveButton onClick={handleSave} saving={saving} saved={saved} />
            </div>
        </div>
    );
}

// ─── Slide card list ──────────────────────────────────────────────────────────

export function SlideshowEditor({ screenId, slides, onSlidesChange }: Props) {
    const [editingSlide, setEditingSlide] = useState<SlideWidget | null>(null);
    const [adding, setAdding] = useState(false);

    const handleToggle = async (slide: SlideWidget) => {
        const newEnabled = !(slide.config?._enabled ?? true);
        const newConfig = { ...(slide.config ?? {}), _enabled: newEnabled };
        await axios.patch(route('widgets.update', slide.id), { config: newConfig });
        onSlidesChange(slides.map((s) => (s.id === slide.id ? { ...s, config: newConfig } : s)));
        notifyDisplayRefresh(screenId);
    };

    const handleMoveUp = async (idx: number) => {
        if (idx === 0) return;
        const updated = [...slides];
        [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
        await Promise.all([
            axios.patch(route('widgets.update', updated[idx - 1].id), { grid_order: idx - 1 }),
            axios.patch(route('widgets.update', updated[idx].id), { grid_order: idx }),
        ]);
        onSlidesChange(updated.map((s, i) => ({ ...s, grid_order: i })));
        notifyDisplayRefresh(screenId);
    };

    const handleMoveDown = async (idx: number) => {
        if (idx === slides.length - 1) return;
        const updated = [...slides];
        [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
        await Promise.all([
            axios.patch(route('widgets.update', updated[idx].id), { grid_order: idx }),
            axios.patch(route('widgets.update', updated[idx + 1].id), { grid_order: idx + 1 }),
        ]);
        onSlidesChange(updated.map((s, i) => ({ ...s, grid_order: i })));
        notifyDisplayRefresh(screenId);
    };

    const handleDelete = async (slide: SlideWidget) => {
        if (!confirm(`Slide "${SLIDE_META[slide.widget_type]?.label}" verwijderen?`)) return;
        await axios.delete(route('widgets.destroy', slide.id));
        onSlidesChange(slides.filter((s) => s.id !== slide.id));
        notifyDisplayRefresh(screenId);
    };

    const handleAdd = async (type: keyof typeof SLIDE_META) => {
        const meta = SLIDE_META[type];
        const res = await axios.post(route('widgets.store', screenId), {
            widget_type: type,
            config: { ...meta.defaultConfig },
            grid_order: slides.length,
        });
        onSlidesChange([...slides, res.data]);
        notifyDisplayRefresh(screenId);
        setAdding(false);
    };

    const handleSave = (updated: SlideWidget) => {
        onSlidesChange(slides.map((s) => (s.id === updated.id ? updated : s)));
    };

    if (editingSlide) {
        return (
            <SlideEditor
                slide={editingSlide}
                screenId={screenId}
                onSave={(updated) => {
                    handleSave(updated);
                    setEditingSlide(updated);
                }}
                onBack={() => setEditingSlide(null)}
            />
        );
    }

    if (adding) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="text-[#6C52FF] hover:underline text-sm font-medium"
                >
                    ← Annuleer
                </button>
                <h3 className="font-semibold text-[#1a1430]">Slide type kiezen</h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(SLIDE_META).map(([type, meta]) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleAdd(type as keyof typeof SLIDE_META)}
                            className="flex items-center gap-3 rounded-xl border border-[#e6e2f4] bg-white p-4 text-left hover:border-[#6C52FF] hover:bg-[#6C52FF]/5 transition-all"
                        >
                            <span className="text-2xl">{meta.icon}</span>
                            <span className="text-sm font-semibold text-[#1a1430]">{meta.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {slides.length === 0 && (
                <p className="text-center text-sm text-[#8b84a8] py-8">
                    Nog geen slides. Voeg er een toe!
                </p>
            )}
            {slides.map((slide, idx) => {
                const meta = SLIDE_META[slide.widget_type];
                const enabled = slide.config?._enabled ?? true;
                return (
                    <div
                        key={slide.id}
                        className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition-all ${enabled ? 'border-[#e6e2f4]' : 'border-[#e6e2f4] opacity-50'}`}
                    >
                        <span className="text-xl w-8 text-center">{meta?.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1a1430] truncate">{meta?.label}</p>
                            <p className="text-xs text-[#8b84a8]">Slide {idx + 1}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleMoveUp(idx)}
                                disabled={idx === 0}
                                className="p-1.5 text-[#b0abc8] hover:text-[#6C52FF] disabled:opacity-30 transition-colors"
                                title="Omhoog"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMoveDown(idx)}
                                disabled={idx === slides.length - 1}
                                className="p-1.5 text-[#b0abc8] hover:text-[#6C52FF] disabled:opacity-30 transition-colors"
                                title="Omlaag"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M6 2v8M10 6l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <Toggle checked={enabled} onChange={() => handleToggle(slide)} />
                            <button
                                type="button"
                                onClick={() => setEditingSlide(slide)}
                                className="ml-1 rounded-lg bg-[#f3f1fb] px-3 py-1.5 text-xs font-semibold text-[#6C52FF] hover:bg-[#6C52FF]/10 transition-colors"
                            >
                                Bewerk
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(slide)}
                                className="p-1.5 text-[#b0abc8] hover:text-[#DD2727] transition-colors"
                                title="Verwijder"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                );
            })}
            <AddButton onClick={() => setAdding(true)} label="Slide toevoegen" />
        </div>
    );
}
