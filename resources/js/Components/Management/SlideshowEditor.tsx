import { useState } from "react";
import axios from "axios";
import { notifyDisplayRefresh } from "@/lib/displayRefresh";
import type { AgendaEventRecord } from "./AgendaManager";
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
}: {
    cfg: Record<string, any>;
    onChange: (c: Record<string, any>) => void;
    agendaEvents?: AgendaEventRecord[];
}) {
    const selectedIds: number[] = cfg.selected_ids ?? [];

    const toggle = (id: number) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id];
        onChange({ ...cfg, selected_ids: next });
    };

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
            <SectionTitle>Evenementen selecteren</SectionTitle>
            {agendaEvents.length === 0 ? (
                <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4">
                    <p className="text-sm text-[#6b6490]">
                        Geen evenementen in de centrale agenda. Voeg ze toe via{" "}
                        <strong>Beheer → Evenementen</strong>.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {agendaEvents.map((ev) => {
                        const selected = selectedIds.includes(ev.id);
                        const grad = ev.grad || `linear-gradient(140deg,${ev.accent},${ev.accent}88)`;
                        return (
                            <button
                                key={ev.id}
                                type="button"
                                onClick={() => toggle(ev.id)}
                                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                                    selected
                                        ? "border-[#6C52FF] bg-[#6C52FF]/5"
                                        : "border-[#e6e2f4] bg-white hover:border-[#6C52FF]/40"
                                }`}
                            >
                                <div className="h-10 w-1.5 rounded-full shrink-0" style={{ background: grad }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#1a1430] truncate">{ev.title}</p>
                                    <p className="text-xs text-[#8b84a8] truncate">
                                        {ev.when_label}
                                        {ev.location ? ` · ${ev.location}` : ""}
                                    </p>
                                </div>
                                <div
                                    className={`h-4 w-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
                                        selected
                                            ? "border-[#6C52FF] bg-[#6C52FF]"
                                            : "border-[#d0cce8] bg-white"
                                    }`}
                                >
                                    {selected && (
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </button>
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
    agendaEvents = [],
}: {
    cfg: Record<string, any>;
    onChange: (c: Record<string, any>) => void;
    agendaEvents?: Record<string, any>[];
}) {
    const isSplit = (cfg.style ?? "split") === "split";

    const setDetails = (patch: Record<string, string>) =>
        onChange({ ...cfg, ...patch });

    const importEvent = (ev: typeof agendaEvents[0]) => {
        onChange({
            ...cfg,
            title: ev.title || ev.name || '',
            badge: ev.tag || ev.where || 'Evenement',
            date: ev.when || '',
            time: '',
            location: ev.where || ev.tag || '',
            body: ev.tagline || '',
            photo: ev.photo || '',
        });
    };

    return (
        <>
        {agendaEvents.length > 0 && (
            <div className="space-y-2 pb-4 border-b border-[#e6e2f4]">
                <p className="text-xs font-bold text-[#5b5478] uppercase tracking-wide">Importeer uit agenda</p>
                <div className="flex flex-col gap-2">
                    {agendaEvents.map((ev, i) => {
                        const grad = ev.grad || (ev.accent
                            ? `linear-gradient(140deg,${ev.accent},${ev.accent})`
                            : 'linear-gradient(140deg,#6C52FF,#FF4490)');
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => importEvent(ev)}
                                className="flex items-center gap-3 rounded-xl border border-[#e6e2f4] bg-white p-3 text-left hover:border-[#6C52FF] hover:bg-[#6C52FF]/5 transition-all"
                            >
                                <div className="h-10 w-1.5 rounded-full shrink-0" style={{ background: grad }} />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#1a1430] truncate">{ev.title || ev.name}</p>
                                    <p className="text-xs text-[#8b84a8]">{ev.when}{ev.tag || ev.where ? ` · ${ev.tag || ev.where}` : ''}</p>
                                </div>
                                <span className="ml-auto text-xs text-[#6C52FF] font-medium shrink-0">Importeer →</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
        <FormWithImagePreview
            imageUrl={cfg.photo ?? ""}
            onImageChange={(url) => onChange({ ...cfg, photo: url })}
            imageHint={
                isSplit
                    ? "Wordt rechts getoond met gradient-overgang."
                    : "Volledige achtergrond van de slide."
            }
        >
            <Field label="Variant">
                <Segmented
                    options={[
                        { value: "split", label: "Tekst + foto" },
                        { value: "overlay", label: "Foto overlay" },
                    ]}
                    value={cfg.style ?? "split"}
                    onChange={(v) => onChange({ ...cfg, style: v })}
                />
            </Field>
            <p className="text-xs text-[#8b84a8]">
                {isSplit
                    ? "Tekst links, foto rechts — met titel en details (datum, tijd, locatie)."
                    : "Volledige achtergrondfoto met badge en tekst linksonder."}
            </p>
            <Divider />
            <Field label="Badge">
                <TextInput
                    value={cfg.badge ?? ""}
                    onChange={(e) =>
                        onChange({ ...cfg, badge: e.target.value })
                    }
                    placeholder={isSplit ? "Moonly Alert" : "Pieter Pot & Andy"}
                />
            </Field>
            {isSplit && (
                <Field label="Titel">
                    <TextInput
                        value={cfg.title ?? ""}
                        onChange={(e) =>
                            onChange({ ...cfg, title: e.target.value })
                        }
                        placeholder="Moonly BBQ"
                    />
                </Field>
            )}
            {isSplit && (
                <div className="grid grid-cols-1 gap-3">
                    <Field label="Datum">
                        <TextInput
                            value={cfg.date ?? ""}
                            onChange={(e) =>
                                setDetails({ date: e.target.value })
                            }
                            placeholder="18 juli 2026"
                        />
                    </Field>
                    <Field label="Tijd">
                        <TextInput
                            value={cfg.time ?? ""}
                            onChange={(e) =>
                                setDetails({ time: e.target.value })
                            }
                            placeholder="17:00 – 21:00"
                        />
                    </Field>
                    <Field label="Locatie">
                        <TextInput
                            value={cfg.location ?? ""}
                            onChange={(e) =>
                                setDetails({ location: e.target.value })
                            }
                            placeholder="Theehuis 't Stroomdal"
                        />
                    </Field>
                </div>
            )}
            <Field
                label="Tekst"
                hint="Gebruik een lege regel voor meerdere alinea's (overlay-variant)."
            >
                <TextArea
                    value={cfg.body ?? ""}
                    onChange={(e) => onChange({ ...cfg, body: e.target.value })}
                    rows={isSplit ? 4 : 6}
                    placeholder={
                        isSplit
                            ? "Aanvullende omschrijving…"
                            : "Eerste alinea…\n\nTweede alinea…"
                    }
                />
            </Field>
        </FormWithImagePreview>
        </>
    );
}

function SlideEditor({
    slide,
    screenId,
    onSave,
    onBack,
    agendaEvents = [],
}: {
    slide: SlideWidget;
    screenId: number;
    onSave: (slide: SlideWidget) => void;
    onBack: () => void;
    agendaEvents?: AgendaEventRecord[];
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
                <AgendaEditor cfg={cfg} onChange={setCfg} agendaEvents={agendaEvents} />
            ) : slide.widget_type === "announcement" ? (
                <AnnouncementEditor cfg={cfg} onChange={setCfg} agendaEvents={agendaEvents} />
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

export function SlideshowEditor({ screenId, slides, onSlidesChange, agendaEvents = [] }: Props) {
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
                <h3 className="font-semibold text-[#1a1430]">
                    Slide type kiezen
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(SLIDE_META).map(([type, meta]) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() =>
                                handleAdd(type as keyof typeof SLIDE_META)
                            }
                            className="flex items-center gap-3 rounded-xl border border-[#e6e2f4] bg-white p-4 text-left hover:border-[#6C52FF] hover:bg-[#6C52FF]/5 transition-all"
                        >
                            <span className="text-2xl">{meta.icon}</span>
                            <span className="text-sm font-semibold text-[#1a1430]">
                                {meta.label}
                            </span>
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
            <div className="grid grid-cols-2 gap-3">
                {slides.map((slide, idx) => {
                    const meta = SLIDE_META[slide.widget_type];
                    const enabled = slide.config?._enabled ?? true;
                    const title = getSlideTitle(slide);
                    const subtitle = getSlideSubtitle(slide);
                    const until = slide.config?._availableUntil;
                    return (
                        <div
                            key={slide.id}
                            className={`rounded-2xl border bg-white p-4 flex flex-col gap-2 transition-all ${enabled ? "border-[#e6e2f4]" : "border-[#e6e2f4] opacity-50"}`}
                        >
                            <div>
                                <span className="text-2xl">{meta?.icon}</span>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b84a8] mt-1">
                                    {meta?.label}
                                </p>
                                <p className="text-sm font-bold text-[#1a1430] mt-0.5 leading-snug truncate">
                                    {title}
                                </p>
                                {subtitle && (
                                    <p className="text-xs text-[#b0abc8] mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                                {until && (
                                    <p className="text-xs text-[#FFB020] font-medium mt-1">
                                        t/m{" "}
                                        {new Date(
                                            until + "T12:00:00",
                                        ).toLocaleDateString("nl-NL", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                )}
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#f0eefa]">
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
                                        <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                        >
                                            <path
                                                d="M6 10V2M2 6l4-4 4 4"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveDown(idx)}
                                        disabled={idx === slides.length - 1}
                                        className="p-1.5 text-[#b0abc8] hover:text-[#6C52FF] disabled:opacity-30 transition-colors"
                                        title="Omlaag"
                                    >
                                        <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                        >
                                            <path
                                                d="M6 2v8M10 6l-4 4-4-4"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
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
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                        >
                                            <path
                                                d="M1 1l12 12M13 1L1 13"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
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
