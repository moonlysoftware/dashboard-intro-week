import { useEffect, useState } from 'react';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';
import { TEAM_BIRTHDAY_COUNT } from '@/lib/birthdays';
import {
    Field,
    TextInput,
    TextArea,
    RowCard,
    SaveButton,
    SectionTitle,
    Divider,
    FormWithImagePreview,
} from './Ui';

interface MgmtWidget {
    id: number;
    widget_type: string;
    grid_order: number;
    config: Record<string, any> | null;
}

interface SpotlightConfig {
    badge?: string;
    emoji?: string;
    title?: string;
    when?: string;
    text?: string;
    grad?: string;
}

interface MomentConfig {
    title?: string;
    caption?: string;
    photo?: string;
}

interface Props {
    screenId: number;
    widgets: MgmtWidget[];
    screenConfig: Record<string, any>;
    onWidgetsChange: (widgets: MgmtWidget[]) => void;
    onConfigChange: (cfg: Record<string, any>) => void;
}

const GENERAL_WIDGETS = [
    { type: 'toggl_time_tracking', order: 0 },
    { type: 'birthday', order: 1 },
    { type: 'spotlight_event', order: 2 },
    { type: 'moment_photo', order: 3 },
] as const;

const DEFAULT_CONFIGS: Record<string, Record<string, any>> = {
    toggl_time_tracking: {
        title: 'Toggl Leaderboard',
        subtitle: 'Deze week · gewerkte uren',
    },
    birthday: {},
    spotlight_event: {
        badge: 'Evenement',
        emoji: '🎉',
        title: 'Moonly BBQ',
        when: 'Vrijdag 17:00',
        text: 'Kom gezellig meedoen!',
        grad: 'linear-gradient(150deg,#6C52FF,#FF4490)',
    },
    moment_photo: {
        title: 'Moonly Moment',
        caption: 'Wat een geweldige dag met het team!',
        photo: '',
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

function migrateBentoConfig(
    bento: Record<string, any>,
    type: string,
    cfg: Record<string, any>,
): Record<string, any> {
    if (type === 'toggl_time_tracking' && bento.toggl) {
        return {
            ...cfg,
            title: bento.toggl.title || cfg.title,
            subtitle: bento.toggl.subtitle || cfg.subtitle,
        };
    }
    if (type === 'spotlight_event' && bento.spotlight) {
        return { ...cfg, ...bento.spotlight };
    }
    if (type === 'moment_photo' && bento.moment) {
        return { ...cfg, ...bento.moment };
    }
    return cfg;
}

export function GeneralEditor({
    screenId,
    widgets,
    screenConfig,
    onWidgetsChange,
    onConfigChange,
}: Props) {
    const bento = screenConfig.bento ?? {};

    const togglWidget = findWidget(widgets, 'toggl_time_tracking');
    const spotlightWidget = findWidget(widgets, 'spotlight_event');
    const momentWidget = findWidget(widgets, 'moment_photo');

    const [togglCfg, setTogglCfg] = useState(() =>
        migrateBentoConfig(bento, 'toggl_time_tracking', widgetConfig(togglWidget, 'toggl_time_tracking')),
    );
    const [spotlight, setSpotlight] = useState<SpotlightConfig>(() =>
        migrateBentoConfig(bento, 'spotlight_event', widgetConfig(spotlightWidget, 'spotlight_event')),
    );
    const [moment, setMoment] = useState<MomentConfig>(() =>
        migrateBentoConfig(bento, 'moment_photo', widgetConfig(momentWidget, 'moment_photo')),
    );

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(false);

    // Ensure the four general widgets exist
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
                saveWidget(togglWidget, togglCfg),
                saveWidget(spotlightWidget, spotlight),
                saveWidget(momentWidget, moment),
            ]);

            // Drop legacy bento key from screen_config after migrating to widgets
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

    if (bootstrapping) {
        return (
            <p className="text-center text-sm text-[#8b84a8] py-8">
                Widgets worden aangemaakt…
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toggl Leaderboard */}
            <section className="space-y-4">
                <SectionTitle>Toggl Leaderboard</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Titel">
                        <TextInput
                            value={togglCfg.title ?? ''}
                            onChange={(e) => setTogglCfg({ ...togglCfg, title: e.target.value })}
                            placeholder="Toggl Leaderboard"
                        />
                    </Field>
                    <Field label="Ondertitel">
                        <TextInput
                            value={togglCfg.subtitle ?? ''}
                            onChange={(e) => setTogglCfg({ ...togglCfg, subtitle: e.target.value })}
                            placeholder="Deze week · gewerkte uren"
                        />
                    </Field>
                </div>
                <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4 space-y-1.5">
                    <p className="text-xs font-bold text-[#5b5478] uppercase tracking-wide">Live Toggl-data</p>
                    <p className="text-sm text-[#6b6490]">
                        Uren per teamlid worden automatisch opgehaald via de Toggl API.
                    </p>
                    <p className="text-xs text-[#8b84a8]">⏱️ Huidige week · top 5 op gewerkte uren</p>
                </div>
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

            {/* Spotlight Event */}
            <section className="space-y-4">
                <SectionTitle>Uitgelicht evenement</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Badge">
                        <TextInput
                            value={spotlight.badge ?? ''}
                            onChange={(e) => setSpotlight({ ...spotlight, badge: e.target.value })}
                            placeholder="Evenement"
                        />
                    </Field>
                    <Field label="Emoji">
                        <TextInput
                            value={spotlight.emoji ?? ''}
                            onChange={(e) => setSpotlight({ ...spotlight, emoji: e.target.value })}
                            placeholder="🎉"
                        />
                    </Field>
                </div>
                <Field label="Titel">
                    <TextInput
                        value={spotlight.title ?? ''}
                        onChange={(e) => setSpotlight({ ...spotlight, title: e.target.value })}
                        placeholder="Moonly BBQ"
                    />
                </Field>
                <Field label="Wanneer">
                    <TextInput
                        value={spotlight.when ?? ''}
                        onChange={(e) => setSpotlight({ ...spotlight, when: e.target.value })}
                        placeholder="Vrijdag 17:00"
                    />
                </Field>
                <Field label="Tekst">
                    <TextArea
                        value={spotlight.text ?? ''}
                        onChange={(e) => setSpotlight({ ...spotlight, text: e.target.value })}
                        rows={3}
                        placeholder="Kom gezellig meedoen!"
                    />
                </Field>
            </section>

            <Divider />

            {/* Moonly Moment */}
            <section>
                <SectionTitle>Moonly Moment</SectionTitle>
                <FormWithImagePreview
                    imageUrl={moment.photo ?? ''}
                    onImageChange={(url) => setMoment({ ...moment, photo: url })}
                    imageLabel="Foto"
                    imageHint="Wordt als achtergrond getoond met titel en bijschrift onderaan."
                >
                    <Field label="Titel">
                        <TextInput
                            value={moment.title ?? ''}
                            onChange={(e) => setMoment({ ...moment, title: e.target.value })}
                            placeholder="Moonly Moment"
                        />
                    </Field>
                    <Field label="Bijschrift">
                        <TextArea
                            value={moment.caption ?? ''}
                            onChange={(e) => setMoment({ ...moment, caption: e.target.value })}
                            rows={2}
                            placeholder="Wat een geweldige dag met het team!"
                        />
                    </Field>
                </FormWithImagePreview>
            </section>

            <div className="pt-2">
                <SaveButton onClick={save} saving={saving} saved={saved} />
            </div>
        </div>
    );
}
