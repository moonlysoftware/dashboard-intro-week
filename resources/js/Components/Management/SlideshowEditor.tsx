import { useState } from "react";
import axios from "axios";
import { notifyDisplayRefresh } from "@/lib/displayRefresh";
import type { AgendaEventRecord } from "./AgendaManager";
import { EventForm } from "./AgendaManager";
import type { AnnouncementRecord } from "./AnnouncementManager";
import { AnnouncementForm } from "./AnnouncementManager";
import {
    Field,
    TextInput,
    TextArea,
    NumberInput,
    Toggle,
    Segmented,
    RowCard,
    AddButton,
    SaveButton,
    SectionTitle,
    Divider,
    FormWithImagePreview,
    ImagePreviewPanel,
} from "./Ui";

interface SlideWidget {
    id: number;
    widget_type: "agenda" | "birthdays" | "appreciation" | "announcement";
    grid_order: number;
    config: Record<string, any> | null;
}

interface Props {
    screenId: number;
    slides: SlideWidget[];
    onSlidesChange: (slides: SlideWidget[]) => void;
    agendaEvents?: AgendaEventRecord[];
    announcements?: AnnouncementRecord[];
    onAgendaEventsChange?: (events: AgendaEventRecord[]) => void;
    onAnnouncementsChange?: (announcements: AnnouncementRecord[]) => void;
}

const SLIDE_META: Record<
    string,
    { label: string; icon: string; defaultConfig: Record<string, any> }
> = {
    agenda: {
        label: "Agenda",
        icon: "📅",
        defaultConfig: { _enabled: true, layout: "featured", events: [] },
    },
    birthdays: {
        label: "Verjaardagen",
        icon: "🎂",
        defaultConfig: { _enabled: true, layout: "featured", list: [] },
    },
    appreciation: {
        label: "Klantwaardering",
        icon: "⭐",
        defaultConfig: {
            _enabled: true,
            layout: "grid",
            style: "review",
            items: [],
        },
    },
    announcement: {
        label: "Aankondiging",
        icon: "📢",
        defaultConfig: {
            _enabled: true,
            style: "split",
            badge: "",
            title: "",
            date: "",
            time: "",
            location: "",
            body: "",
            photo: "",
        },
    },
};

function getSlideTitle(slide: SlideWidget): string {
    const cfg = slide.config ?? {};
    if (slide.widget_type === "announcement")
        return cfg.title || "Aankondiging";
    if (slide.widget_type === "agenda") {
        const first = cfg.events?.[0]?.title;
        return first ? first : "Agenda";
    }
    return SLIDE_META[slide.widget_type]?.label ?? slide.widget_type;
}

function getSlideSubtitle(slide: SlideWidget): string {
    const cfg = slide.config ?? {};
    if (slide.widget_type === "announcement") return cfg.badge || "";
    if (slide.widget_type === "agenda") {
        const n = cfg.events?.length ?? 0;
        return `${n} evenement${n !== 1 ? "en" : ""}`;
    }
    if (slide.widget_type === "birthdays") {
        const n = cfg.list?.length ?? 0;
        return `${n} jarige${n !== 1 ? "n" : ""}`;
    }
    if (slide.widget_type === "appreciation") {
        const n = cfg.items?.length ?? 0;
        return `${n} beoordeling${n !== 1 ? "en" : ""}`;
    }
    return "";
}

// ─── Per-slide content editors ────────────────────────────────────────────────

function AgendaEditor({
    cfg,
    onChange,
    agendaEvents = [],
    onAgendaEventsChange,
}: {
    cfg: Record<string, any>;
    onChange: (c: Record<string, any>) => void;
    agendaEvents?: AgendaEventRecord[];
    onAgendaEventsChange?: (events: AgendaEventRecord[]) => void;
}) {
    const [inlineEdit, setInlineEdit] = useState<AgendaEventRecord | 'new' | null>(null);
    const [inlineSaving, setInlineSaving] = useState(false);
    const selectedIds: number[] = cfg.selected_ids ?? [];

    const toggle = (id: number) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id];
        onChange({ ...cfg, selected_ids: next });
    };

    const handleInlineSave = async (form: any) => {
        setInlineSaving(true);
        try {
            if (inlineEdit === 'new') {
                const res = await axios.post(route('agenda-events.store'), form);
                onAgendaEventsChange?.([...agendaEvents, res.data]);
                onChange({ ...cfg, selected_ids: [...selectedIds, res.data.id] });
            } else if (inlineEdit) {
                const res = await axios.patch(route('agenda-events.update', inlineEdit.id), form);
                onAgendaEventsChange?.(agendaEvents.map((e) => e.id === (inlineEdit as AgendaEventRecord).id ? res.data : e));
            }
            setInlineEdit(null);
        } finally {
            setInlineSaving(false);
        }
    };

    if (inlineEdit !== null) {
        const initial = inlineEdit === 'new' ? {} : {
            title: inlineEdit.title,
            when_label: inlineEdit.when_label,
            when_date: inlineEdit.when_date ?? '',
            location: inlineEdit.location ?? '',
            tagline: inlineEdit.tagline ?? '',
            accent: inlineEdit.accent,
            grad: inlineEdit.grad ?? '',
            photo: inlineEdit.photo ?? '',
            pos: inlineEdit.pos ?? '',
        };
        return (
            <EventForm
                initial={initial}
                onSave={handleInlineSave}
                onBack={() => setInlineEdit(null)}
                saving={inlineSaving}
            />
        );
    }

    return (
        <div className="space-y-4">
            <Field label="Lay-out">
                <Segmented
                    options={[
                        { value: "featured", label: "Uitgelicht" },
                        { value: "grid", label: "Grid" },
                        { value: "list", label: "Lijst" },
                    ]}
                    value={cfg.layout ?? "featured"}
                    onChange={(v) => onChange({ ...cfg, layout: v })}
                />
            </Field>
            <Divider />
            <div className="flex items-center justify-between">
                <SectionTitle>Evenementen selecteren</SectionTitle>
                <button
                    type="button"
                    onClick={() => setInlineEdit('new')}
                    className="text-xs font-semibold text-[#6C52FF] hover:underline"
                >
                    + Nieuw evenement
                </button>
            </div>
            {agendaEvents.length === 0 ? (
                <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4">
                    <p className="text-sm text-[#6b6490]">
                        Nog geen evenementen. Klik op <strong>+ Nieuw evenement</strong> om er een toe te voegen.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {agendaEvents.map((ev) => {
                        const selected = selectedIds.includes(ev.id);
                        const grad = ev.grad || `linear-gradient(140deg,${ev.accent},${ev.accent}88)`;
                        return (
                            <div key={ev.id} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => toggle(ev.id)}
                                    className={`flex-1 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                                        selected
                                            ? "border-[#6C52FF] bg-[#6C52FF]/5"
                                            : "border-[#e6e2f4] bg-white hover:border-[#6C52FF]/40"
                                    }`}
                                >
                                    <div className="h-10 w-1.5 rounded-full shrink-0" style={{ background: grad }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#1a1430] truncate">{ev.title}</p>
                                        <p className="text-xs text-[#8b84a8] truncate">
                                            {ev.when_label}{ev.location ? ` · ${ev.location}` : ""}
                                        </p>
                                    </div>
                                    <div
                                        className={`h-4 w-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
                                            selected ? "border-[#6C52FF] bg-[#6C52FF]" : "border-[#d0cce8] bg-white"
                                        }`}
                                    >
                                        {selected && (
                                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInlineEdit(ev)}
                                    className="p-2 text-[#b0abc8] hover:text-[#6C52FF] transition-colors shrink-0"
                                    title="Bewerk"
                                >
                                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                        <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            {selectedIds.length > 0 && (
                <p className="text-xs text-[#8b84a8]">
                    {selectedIds.length} evenement{selectedIds.length !== 1 ? "en" : ""} geselecteerd
                </p>
            )}
        </div>
    );
}

function BirthdaysEditor({
    cfg,
    onChange,
}: {
    cfg: Record<string, any>;
    onChange: (c: Record<string, any>) => void;
}) {
    const list: any[] = cfg.list ?? [];

    const setList = (l: any[]) => onChange({ ...cfg, list: l });

    const add = () => setList([...list, { name: "", date: "", photo: "" }]);
    const update = (i: number, patch: Record<string, any>) =>
        setList(list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
    const remove = (i: number) => setList(list.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            <Field label="Lay-out">
                <Segmented
                    options={[
                        { value: "featured", label: "Uitgelicht" },
                        { value: "grid", label: "Grid" },
                    ]}
                    value={cfg.layout ?? "featured"}
                    onChange={(v) => onChange({ ...cfg, layout: v })}
                />
            </Field>
            <Divider />
            <SectionTitle>Jarigen</SectionTitle>
            <div className="space-y-3">
                {list.map((p, i) => (
                    <RowCard key={i} onDelete={() => remove(i)}>
                        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 items-start pr-6">
                            <div className="space-y-3 min-w-0">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Naam">
                                        <TextInput
                                            value={p.name}
                                            onChange={(e) =>
                                                update(i, {
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Jan de Vries"
                                        />
                                    </Field>
                                    <Field label="Datum">
                                        <TextInput
                                            value={p.date}
                                            onChange={(e) =>
                                                update(i, {
                                                    date: e.target.value,
                                                })
                                            }
                                            placeholder="19 jun"
                                        />
                                    </Field>
                                </div>
                            </div>
                            <ImagePreviewPanel
                                value={p.photo ?? ""}
                                onChange={(url) => update(i, { photo: url })}
                                label="Foto"
                            />
                        </div>
                    </RowCard>
                ))}
            </div>
            <AddButton onClick={add} label="Jarige toevoegen" />
        </div>
    );
}

function AppreciationEditor({
    cfg,
    onChange,
}: {
    cfg: Record<string, any>;
    onChange: (c: Record<string, any>) => void;
}) {
    const items: any[] = cfg.items ?? [];

    const setItems = (it: any[]) => onChange({ ...cfg, items: it });
    const add = () => setItems([...items, { author: "", stars: 5, text: "" }]);
    const update = (i: number, patch: Record<string, any>) =>
        setItems(items.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
    const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Field label="Lay-out">
                    <Segmented
                        options={[
                            { value: "grid", label: "Grid" },
                            { value: "spotlight", label: "Spotlight" },
                            { value: "list", label: "Lijst" },
                        ]}
                        value={cfg.layout ?? "grid"}
                        onChange={(v) => onChange({ ...cfg, layout: v })}
                    />
                </Field>
                <Field label="Stijl">
                    <Segmented
                        options={[
                            { value: "review", label: "Review" },
                            { value: "chat", label: "Chat" },
                        ]}
                        value={cfg.style ?? "review"}
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
                                    onChange={(e) =>
                                        update(i, { author: e.target.value })
                                    }
                                    placeholder="Maria K."
                                />
                            </Field>
                            <Field label="Sterren (1–5)">
                                <NumberInput
                                    value={item.stars ?? 5}
                                    onChange={(e) =>
                                        update(i, {
                                            stars: Number(e.target.value),
                                        })
                                    }
                                    min={1}
                                    max={5}
                                />
                            </Field>
                        </div>
                        <Field label="Tekst">
                            <TextArea
                                value={item.text}
                                onChange={(e) =>
                                    update(i, { text: e.target.value })
                                }
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

function AnnouncementEditor({
    cfg,
    onChange,
    announcements = [],
    onAnnouncementsChange,
}: {
    cfg: Record<string, any>;
    onChange: (c: Record<string, any>) => void;
    announcements?: AnnouncementRecord[];
    onAnnouncementsChange?: (announcements: AnnouncementRecord[]) => void;
}) {
    const [inlineEdit, setInlineEdit] = useState<AnnouncementRecord | 'new' | null>(null);
    const [inlineSaving, setInlineSaving] = useState(false);
    const selectedId = cfg.announcement_id ?? null;

    const handleInlineSave = async (form: any) => {
        setInlineSaving(true);
        try {
            if (inlineEdit === 'new') {
                const res = await axios.post(route('announcements.store'), form);
                onAnnouncementsChange?.([res.data, ...announcements]);
                onChange({ ...cfg, announcement_id: res.data.id });
            } else if (inlineEdit) {
                const res = await axios.patch(route('announcements.update', (inlineEdit as AnnouncementRecord).id), form);
                onAnnouncementsChange?.(announcements.map((a) => a.id === (inlineEdit as AnnouncementRecord).id ? res.data : a));
            }
            setInlineEdit(null);
        } finally {
            setInlineSaving(false);
        }
    };

    if (inlineEdit !== null) {
        const initial = inlineEdit === 'new' ? {} : {
            style: inlineEdit.style,
            badge: inlineEdit.badge ?? '',
            title: inlineEdit.title ?? '',
            photo: inlineEdit.photo ?? '',
            pos: inlineEdit.pos ?? '',
            date: inlineEdit.date ?? '',
            time: inlineEdit.time ?? '',
            location: inlineEdit.location ?? '',
            body: inlineEdit.body ?? '',
        };
        return (
            <AnnouncementForm
                initial={initial}
                onSave={handleInlineSave}
                onBack={() => setInlineEdit(null)}
                saving={inlineSaving}
            />
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5b5478] uppercase tracking-wide">Mededeling kiezen</span>
                <button
                    type="button"
                    onClick={() => setInlineEdit('new')}
                    className="text-xs font-semibold text-[#6C52FF] hover:underline"
                >
                    + Nieuwe mededeling
                </button>
            </div>
            {announcements.length === 0 ? (
                <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4 text-center space-y-1">
                    <p className="text-sm font-semibold text-[#5b5478]">Nog geen mededelingen</p>
                    <p className="text-xs text-[#8b84a8]">Klik op <strong>+ Nieuwe mededeling</strong> om er een aan te maken.</p>
                </div>
            ) : (
                announcements.map((ann) => {
                    const selected = selectedId === ann.id;
                    return (
                        <div key={ann.id} className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onChange({ ...cfg, announcement_id: ann.id })}
                                className={`flex-1 flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                                    selected
                                        ? 'border-[#6C52FF] bg-[#6C52FF]/5'
                                        : 'border-[#e6e2f4] bg-white hover:border-[#6C52FF]/50 hover:bg-[#f8f6fd]'
                                }`}
                            >
                                {ann.photo ? (
                                    <img src={ann.photo} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="h-10 w-1.5 rounded-full shrink-0 bg-gradient-to-b from-[#6C52FF] to-[#FF4490]" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#1a1430] truncate">
                                        {ann.title || ann.badge || 'Naamloos'}
                                    </p>
                                    <p className="text-xs text-[#8b84a8] truncate">
                                        {[ann.badge, ann.date, ann.location].filter(Boolean).join(' · ') ||
                                            (ann.style === 'split' ? 'Tekst + foto' : 'Foto overlay')}
                                    </p>
                                </div>
                                {selected && <span className="text-[#6C52FF] font-bold text-sm shrink-0">✓</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInlineEdit(ann)}
                                className="p-2 text-[#b0abc8] hover:text-[#6C52FF] transition-colors shrink-0"
                                title="Bewerk"
                            >
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                    <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
}

function SlideEditor({
    slide,
    screenId,
    onSave,
    onBack,
    agendaEvents = [],
    announcements = [],
    onAgendaEventsChange,
    onAnnouncementsChange,
}: {
    slide: SlideWidget;
    screenId: number;
    onSave: (slide: SlideWidget) => void;
    onBack: () => void;
    agendaEvents?: AgendaEventRecord[];
    announcements?: AnnouncementRecord[];
    onAgendaEventsChange?: (events: AgendaEventRecord[]) => void;
    onAnnouncementsChange?: (announcements: AnnouncementRecord[]) => void;
}) {
    const [cfg, setCfg] = useState<Record<string, any>>(
        slide.config ?? SLIDE_META[slide.widget_type]?.defaultConfig ?? {},
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const meta = SLIDE_META[slide.widget_type];

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(route("widgets.update", slide.id), {
                config: cfg,
            });
            onSave({ ...slide, config: res.data.config });
            notifyDisplayRefresh(screenId);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const EditorComponent =
        slide.widget_type === "agenda"
            ? AgendaEditor
            : slide.widget_type === "birthdays"
              ? BirthdaysEditor
              : slide.widget_type === "appreciation"
                ? AppreciationEditor
                : AnnouncementEditor;

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

            <Field label="Naam" hint="Interne naam — zichtbaar in het slideoverzicht">
                <TextInput
                    value={cfg._name ?? ""}
                    onChange={(e) => setCfg({ ...cfg, _name: e.target.value })}
                    placeholder={meta?.label ?? ""}
                />
            </Field>

            <Field
                label="Beschikbaar tot (optioneel)"
                hint="De slide wordt automatisch uitgeschakeld na deze datum."
            >
                <TextInput
                    type="date"
                    value={cfg._availableUntil ?? ""}
                    onChange={(e) =>
                        setCfg({
                            ...cfg,
                            _availableUntil: e.target.value || null,
                        })
                    }
                />
            </Field>
            <Divider />

            {slide.widget_type === "agenda" ? (
                <AgendaEditor cfg={cfg} onChange={setCfg} agendaEvents={agendaEvents} onAgendaEventsChange={onAgendaEventsChange} />
            ) : slide.widget_type === "announcement" ? (
                <AnnouncementEditor cfg={cfg} onChange={setCfg} announcements={announcements} onAnnouncementsChange={onAnnouncementsChange} />
            ) : (
                <EditorComponent cfg={cfg} onChange={setCfg} />
            )}

            <div className="pt-2">
                <SaveButton
                    onClick={handleSave}
                    saving={saving}
                    saved={saved}
                />
            </div>
        </div>
    );
}

// ─── Slide card list ──────────────────────────────────────────────────────────

export function SlideshowEditor({ screenId, slides, onSlidesChange, agendaEvents = [], announcements = [], onAgendaEventsChange, onAnnouncementsChange }: Props) {
    const [editingSlide, setEditingSlide] = useState<SlideWidget | null>(null);
    const [adding, setAdding] = useState(false);

    const handleToggle = async (slide: SlideWidget) => {
        const newEnabled = !(slide.config?._enabled ?? true);
        const newConfig = { ...(slide.config ?? {}), _enabled: newEnabled };
        await axios.patch(route("widgets.update", slide.id), {
            config: newConfig,
        });
        onSlidesChange(
            slides.map((s) =>
                s.id === slide.id ? { ...s, config: newConfig } : s,
            ),
        );
        notifyDisplayRefresh(screenId);
    };

    const handleMoveUp = async (idx: number) => {
        if (idx === 0) return;
        const updated = [...slides];
        [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
        await Promise.all([
            axios.patch(route("widgets.update", updated[idx - 1].id), {
                grid_order: idx - 1,
            }),
            axios.patch(route("widgets.update", updated[idx].id), {
                grid_order: idx,
            }),
        ]);
        onSlidesChange(updated.map((s, i) => ({ ...s, grid_order: i })));
        notifyDisplayRefresh(screenId);
    };

    const handleMoveDown = async (idx: number) => {
        if (idx === slides.length - 1) return;
        const updated = [...slides];
        [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
        await Promise.all([
            axios.patch(route("widgets.update", updated[idx].id), {
                grid_order: idx,
            }),
            axios.patch(route("widgets.update", updated[idx + 1].id), {
                grid_order: idx + 1,
            }),
        ]);
        onSlidesChange(updated.map((s, i) => ({ ...s, grid_order: i })));
        notifyDisplayRefresh(screenId);
    };

    const handleDelete = async (slide: SlideWidget) => {
        if (
            !confirm(
                `Slide "${SLIDE_META[slide.widget_type]?.label}" verwijderen?`,
            )
        )
            return;
        await axios.delete(route("widgets.destroy", slide.id));
        onSlidesChange(slides.filter((s) => s.id !== slide.id));
        notifyDisplayRefresh(screenId);
    };

    const handleAdd = async (type: keyof typeof SLIDE_META) => {
        const meta = SLIDE_META[type];
        const res = await axios.post(route("widgets.store", screenId), {
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
                agendaEvents={agendaEvents}
                announcements={announcements}
                onAgendaEventsChange={onAgendaEventsChange}
                onAnnouncementsChange={onAnnouncementsChange}
            />
        );
    }

    const birthdayExists = slides.some((s) => s.widget_type === 'birthdays');

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
                <h3 className="font-semibold text-[#1a1430]">
                    Slide type kiezen
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(SLIDE_META).map(([type, meta]) => {
                        const disabled = type === 'birthdays' && birthdayExists;
                        return (
                            <button
                                key={type}
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                    !disabled && handleAdd(type as keyof typeof SLIDE_META)
                                }
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${disabled ? 'border-[#e6e2f4] bg-[#f8f7fc] opacity-40 cursor-not-allowed' : 'border-[#e6e2f4] bg-white hover:border-[#6C52FF] hover:bg-[#6C52FF]/5'}`}
                            >
                                <span className="text-2xl">{meta.icon}</span>
                                <span className="text-sm font-semibold text-[#1a1430]">
                                    {meta.label}
                                    {disabled && <span className="block text-xs font-normal text-[#8b84a8]">Al toegevoegd</span>}
                                </span>
                            </button>
                        );
                    })}
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
            <div className="grid grid-cols-2 gap-3">
                {slides.map((slide, idx) => {
                    const meta = SLIDE_META[slide.widget_type];
                    const enabled = slide.config?._enabled ?? true;
                    const name = slide.config?._name || getSlideTitle(slide);
                    const subtitle = getSlideSubtitle(slide);
                    const until = slide.config?._availableUntil;
                    const annRecord = slide.widget_type === "announcement"
                        ? announcements.find((a) => a.id === slide.config?.announcement_id) ?? null
                        : null;
                    const photo = slide.widget_type === "announcement"
                        ? (annRecord?.photo ?? slide.config?.photo ?? null)
                        : null;
                    const photoPos = annRecord?.pos ?? slide.config?.pos ?? "center";
                    const THUMB_GRAD: Record<string, string> = {
                        announcement: "linear-gradient(135deg,#3a1f6e,#6C1F8E)",
                        agenda:       "linear-gradient(135deg,#1e1660,#6C52FF)",
                        birthdays:    "linear-gradient(135deg,#6b1040,#FF4490)",
                        appreciation: "linear-gradient(135deg,#5a3800,#FFB020)",
                    };
                    const thumbGrad = THUMB_GRAD[slide.widget_type] ?? "linear-gradient(135deg,#2a1f44,#6C52FF)";
                    return (
                        <div
                            key={slide.id}
                            className={`rounded-2xl border bg-white flex flex-col overflow-hidden transition-all ${enabled ? "border-[#e6e2f4]" : "border-[#e6e2f4] opacity-50"}`}
                        >
                            {/* Thumbnail */}
                            <div
                                className="relative h-[88px] shrink-0"
                                style={{ background: photo ? "#08060f" : thumbGrad }}
                            >
                                {photo && (
                                    <img
                                        src={photo}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ objectPosition: photoPos }}
                                    />
                                )}
                                <div
                                    className="absolute inset-0"
                                    style={{ background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,.55) 100%)" }}
                                />
                                <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
                                    <span className="text-base leading-none">{meta?.icon}</span>
                                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">
                                        {meta?.label}
                                    </span>
                                </div>
                                {!enabled && (
                                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase tracking-wide">
                                        Uit
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="px-3 pt-2.5 pb-1 flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1a1430] leading-snug truncate">
                                    {name}
                                </p>
                                {subtitle && (
                                    <p className="text-xs text-[#b0abc8] mt-0.5 truncate">{subtitle}</p>
                                )}
                                {until && (
                                    <p className="text-xs text-[#FFB020] font-medium mt-1">
                                        t/m {new Date(until + "T12:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-[#f0eefa] mt-1">
                                <Toggle
                                    checked={enabled}
                                    onChange={() => handleToggle(slide)}
                                />
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveUp(idx)}
                                        disabled={idx === 0}
                                        className="p-1.5 text-[#b0abc8] hover:text-[#6C52FF] disabled:opacity-30 transition-colors"
                                        title="Omhoog"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                            <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveDown(idx)}
                                        disabled={idx === slides.length - 1}
                                        className="p-1.5 text-[#b0abc8] hover:text-[#6C52FF] disabled:opacity-30 transition-colors"
                                        title="Omlaag"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                            <path d="M6 2v8M10 6l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingSlide(slide)}
                                        className="rounded-lg bg-[#f3f1fb] px-2.5 py-1 text-xs font-semibold text-[#6C52FF] hover:bg-[#6C52FF]/10 transition-colors"
                                    >
                                        Bewerk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(slide)}
                                        className="p-1.5 text-[#b0abc8] hover:text-[#DD2727] transition-colors"
                                        title="Verwijder"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <AddButton
                onClick={() => setAdding(true)}
                label="Slide toevoegen"
            />
        </div>
    );
}
