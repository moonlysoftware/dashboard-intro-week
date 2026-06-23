import { useEffect, useState } from 'react';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';
import { TEAM_BIRTHDAY_COUNT } from '@/lib/birthdays';
import type { AgendaEventRecord } from './AgendaManager';
import { EventForm } from './AgendaManager';
import type { AnnouncementRecord } from './AnnouncementManager';
import { AnnouncementForm } from './AnnouncementManager';
import {
    Field,
    TextInput,
    SaveButton,
    SectionTitle,
    Divider,
} from './Ui';

interface MgmtWidget {
    id: number;
    widget_type: string;
    grid_order: number;
    config: Record<string, any> | null;
}

interface Props {
    screenId: number;
    widgets: MgmtWidget[];
    screenConfig: Record<string, any>;
    onWidgetsChange: (widgets: MgmtWidget[]) => void;
    onConfigChange: (cfg: Record<string, any>) => void;
    agendaEvents?: AgendaEventRecord[];
    announcements?: AnnouncementRecord[];
    onAgendaEventsChange?: (events: AgendaEventRecord[]) => void;
    onAnnouncementsChange?: (announcements: AnnouncementRecord[]) => void;
}

const GENERAL_WIDGETS = [
    { type: 'agenda', order: 0 },
    { type: 'birthday', order: 1 },
    { type: 'announcements', order: 2 },
] as const;

const DEFAULT_CONFIGS: Record<string, Record<string, any>> = {
    agenda: {
        title: 'Agenda',
        subtitle: 'Aankomende evenementen',
        events: [],
    },
    birthday: {},
    announcements: {
        selected_announcement_ids: [],
    },
};

function findWidget(widgets: MgmtWidget[], type: string): MgmtWidget | undefined {
    if (type === 'birthday') {
        return widgets.find((w) => w.widget_type === 'birthday' || w.widget_type === 'birthdays');
    }
    return widgets.find((w) => w.widget_type === type);
}

function widgetConfig(widget: MgmtWidget | undefined, type: string): Record<string, any> {
    const cfg = widget?.config ?? {};
    if (Object.keys(cfg).length > 0) return cfg;
    return { ...DEFAULT_CONFIGS[type] };
}

export function GeneralEditor({
    screenId,
    widgets,
    screenConfig,
    onWidgetsChange,
    onConfigChange,
    agendaEvents = [],
    announcements = [],
    onAgendaEventsChange,
    onAnnouncementsChange,
}: Props) {
    const agendaWidget = findWidget(widgets, 'agenda');
    const announcementsWidget = findWidget(widgets, 'announcements');

    const [agendaCfg, setAgendaCfg] = useState<{ title: string; subtitle: string }>(() => {
        const cfg = widgetConfig(agendaWidget, 'agenda');
        return {
            title: cfg.title ?? 'Agenda',
            subtitle: cfg.subtitle ?? 'Aankomende evenementen',
        };
    });

    const [selectedIds, setSelectedIds] = useState<number[]>(() => {
        const cfg = widgetConfig(announcementsWidget, 'announcements');
        return cfg.selected_announcement_ids ?? [];
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(false);

    // Inline create/edit for agenda events
    const [editingEvent, setEditingEvent] = useState<AgendaEventRecord | 'new' | null>(null);
    const [eventSaving, setEventSaving] = useState(false);

    const handleEventSave = async (form: any) => {
        setEventSaving(true);
        try {
            if (editingEvent === 'new') {
                const res = await axios.post(route('agenda-events.store'), form);
                onAgendaEventsChange?.([...agendaEvents, res.data]);
            } else if (editingEvent) {
                const res = await axios.patch(route('agenda-events.update', (editingEvent as AgendaEventRecord).id), form);
                onAgendaEventsChange?.(agendaEvents.map((e) => e.id === (editingEvent as AgendaEventRecord).id ? res.data : e));
            }
            setEditingEvent(null);
        } finally {
            setEventSaving(false);
        }
    };

    // Inline create/edit for announcements
    const [editingAnn, setEditingAnn] = useState<AnnouncementRecord | 'new' | null>(null);
    const [annSaving, setAnnSaving] = useState(false);

    const handleAnnSave = async (form: any) => {
        setAnnSaving(true);
        try {
            if (editingAnn === 'new') {
                const res = await axios.post(route('announcements.store'), form);
                const updated = [res.data, ...announcements];
                onAnnouncementsChange?.(updated);
                setSelectedIds((prev) => [...prev, res.data.id]);
            } else if (editingAnn) {
                const res = await axios.patch(route('announcements.update', (editingAnn as AnnouncementRecord).id), form);
                onAnnouncementsChange?.(announcements.map((a) => a.id === (editingAnn as AnnouncementRecord).id ? res.data : a));
            }
            setEditingAnn(null);
        } finally {
            setAnnSaving(false);
        }
    };

    // Ensure required general widgets exist
    useEffect(() => {
        const missing = GENERAL_WIDGETS.filter((w) => !findWidget(widgets, w.type));
        if (missing.length === 0) return;

        let cancelled = false;
        setBootstrapping(true);

        (async () => {
            const created: MgmtWidget[] = [];
            for (const spec of missing) {
                const res = await axios.post(route('widgets.store', screenId), {
                    widget_type: spec.type,
                    config: { ...DEFAULT_CONFIGS[spec.type] },
                    grid_order: spec.order,
                });
                created.push(res.data);
            }
            if (!cancelled) {
                onWidgetsChange([...widgets, ...created]);
                setBootstrapping(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [screenId, widgets, onWidgetsChange]);

    const saveWidget = async (widget: MgmtWidget | undefined, config: Record<string, any>) => {
        if (!widget) return;
        const res = await axios.patch(route('widgets.update', widget.id), { config });
        onWidgetsChange(
            widgets.map((w) => (w.id === widget.id ? { ...w, config: res.data.config } : w)),
        );
    };

    const save = async () => {
        setSaving(true);
        try {
            await Promise.all([
                saveWidget(agendaWidget, agendaCfg),
                saveWidget(announcementsWidget, { selected_announcement_ids: selectedIds }),
            ]);

            // Drop legacy bento key from screen_config
            if (screenConfig.bento) {
                const { bento: _removed, ...rest } = screenConfig;
                const res = await axios.patch(route('screens.updateConfig', screenId), {
                    screen_config: rest,
                });
                onConfigChange(res.data.screen_config);
            }

            notifyDisplayRefresh(screenId);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const toggleAnnouncement = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    if (bootstrapping) {
        return (
            <p className="text-center text-sm text-[#8b84a8] py-8">
                Widgets worden aangemaakt…
            </p>
        );
    }

    // Show inline event form when editing
    if (editingEvent !== null) {
        const initial = editingEvent === 'new' ? {} : {
            title: editingEvent.title,
            when_label: editingEvent.when_label,
            when_date: editingEvent.when_date ?? '',
            location: editingEvent.location ?? '',
            tagline: editingEvent.tagline ?? '',
            accent: editingEvent.accent,
            grad: editingEvent.grad ?? '',
            photo: editingEvent.photo ?? '',
            pos: editingEvent.pos ?? '',
        };
        return (
            <EventForm
                initial={initial}
                onSave={handleEventSave}
                onBack={() => setEditingEvent(null)}
                saving={eventSaving}
            />
        );
    }

    // Show inline announcement form when editing
    if (editingAnn !== null) {
        const initial = editingAnn === 'new' ? {} : {
            style: editingAnn.style,
            badge: editingAnn.badge ?? '',
            title: editingAnn.title ?? '',
            photo: editingAnn.photo ?? '',
            pos: editingAnn.pos ?? '',
            date: editingAnn.date ?? '',
            time: editingAnn.time ?? '',
            location: editingAnn.location ?? '',
            body: editingAnn.body ?? '',
        };
        return (
            <AnnouncementForm
                initial={initial}
                onSave={handleAnnSave}
                onBack={() => setEditingAnn(null)}
                saving={annSaving}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Agenda */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionTitle>Agenda</SectionTitle>
                    <button
                        type="button"
                        onClick={() => setEditingEvent('new')}
                        className="text-xs font-semibold text-[#6C52FF] hover:underline"
                    >
                        + Nieuw evenement
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Titel">
                        <TextInput
                            value={agendaCfg.title}
                            onChange={(e) => setAgendaCfg({ ...agendaCfg, title: e.target.value })}
                            placeholder="Agenda"
                        />
                    </Field>
                    <Field label="Ondertitel">
                        <TextInput
                            value={agendaCfg.subtitle}
                            onChange={(e) => setAgendaCfg({ ...agendaCfg, subtitle: e.target.value })}
                            placeholder="Aankomende evenementen"
                        />
                    </Field>
                </div>
                {agendaEvents.length === 0 ? (
                    <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4 space-y-1.5">
                        <p className="text-xs font-bold text-[#5b5478] uppercase tracking-wide">Centrale agenda</p>
                        <p className="text-sm text-[#6b6490]">
                            De eerstvolgende 6 evenementen worden automatisch getoond. Klik op <strong>+ Nieuw evenement</strong> om er een toe te voegen.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {agendaEvents.map((ev) => {
                            const grad = ev.grad || `linear-gradient(140deg,${ev.accent},${ev.accent}88)`;
                            return (
                                <div key={ev.id} className="flex items-center gap-1 rounded-xl border border-[#e6e2f4] bg-white px-3 py-2.5">
                                    <div className="h-8 w-1.5 rounded-full shrink-0" style={{ background: grad }} />
                                    <div className="flex-1 min-w-0 ml-2">
                                        <p className="text-sm font-semibold text-[#1a1430] truncate">{ev.title}</p>
                                        <p className="text-xs text-[#8b84a8] truncate">{ev.when_label}{ev.location ? ` · ${ev.location}` : ''}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingEvent(ev)}
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
                        <p className="text-xs text-[#8b84a8]">De eerstvolgende 6 worden automatisch getoond op het scherm.</p>
                    </div>
                )}
            </section>

            <Divider />

            {/* Birthdays */}
            <section className="space-y-4">
                <SectionTitle>Verjaardagen</SectionTitle>
                <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4 space-y-1.5">
                    <p className="text-xs font-bold text-[#5b5478] uppercase tracking-wide">Teamlijst</p>
                    <p className="text-sm text-[#6b6490]">
                        De 3 eerstvolgende verjaardagen worden automatisch getoond op basis van de teamlijst.
                    </p>
                    <p className="text-xs text-[#8b84a8]">
                        🎂 {TEAM_BIRTHDAY_COUNT} teamleden · gesorteerd op eerstvolgende datum
                    </p>
                </div>
            </section>

            <Divider />

            {/* Announcements */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionTitle>Mededelingen</SectionTitle>
                    <button
                        type="button"
                        onClick={() => setEditingAnn('new')}
                        className="text-xs font-semibold text-[#6C52FF] hover:underline"
                    >
                        + Nieuwe mededeling
                    </button>
                </div>

                {announcements.length === 0 ? (
                    <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4 text-center space-y-1">
                        <p className="text-sm font-semibold text-[#5b5478]">Nog geen mededelingen</p>
                        <p className="text-xs text-[#8b84a8]">
                            Klik op <strong>+ Nieuwe mededeling</strong> om er een aan te maken.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {announcements.map((ann) => {
                            const selected = selectedIds.includes(ann.id);
                            return (
                                <div key={ann.id} className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => toggleAnnouncement(ann.id)}
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
                                        onClick={() => setEditingAnn(ann)}
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
                        {selectedIds.length > 0 && (
                            <p className="text-xs text-[#8b84a8] pt-1">
                                {selectedIds.length} mededeling{selectedIds.length !== 1 ? 'en' : ''} geselecteerd · worden om de 6 seconden gewisseld
                            </p>
                        )}
                    </div>
                )}
            </section>

            <div className="pt-2">
                <SaveButton onClick={save} saving={saving} saved={saved} />
            </div>
        </div>
    );
}
