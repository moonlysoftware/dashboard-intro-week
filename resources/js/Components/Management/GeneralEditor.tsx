import { useState } from 'react';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';
import { Field, TextInput, TextArea, NumberInput, RowCard, AddButton, SaveButton, SectionTitle, Divider } from './Ui';

interface TogglEntry {
    name: string;
    hours: number;
    color?: string;
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

interface BentoConfig {
    toggl?: { title?: string; subtitle?: string; entries?: TogglEntry[] };
    spotlight?: SpotlightConfig;
    moment?: MomentConfig;
}

interface Props {
    screenId: number;
    screenConfig: Record<string, any>;
    onConfigChange: (cfg: Record<string, any>) => void;
}

export function GeneralEditor({ screenId, screenConfig, onConfigChange }: Props) {
    const bento: BentoConfig = screenConfig.bento ?? {};
    const [local, setLocal] = useState<BentoConfig>(bento);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const patch = (delta: Partial<BentoConfig>) => setLocal((prev) => ({ ...prev, ...delta }));

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(route('screens.updateConfig', screenId), {
                screen_config: { ...screenConfig, bento: local },
            });
            onConfigChange(res.data.screen_config);
            notifyDisplayRefresh(screenId);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    // Toggl entries
    const entries: TogglEntry[] = local.toggl?.entries ?? [];
    const setEntries = (e: TogglEntry[]) => patch({ toggl: { ...local.toggl, entries: e } });
    const addEntry = () => setEntries([...entries, { name: '', hours: 0, color: '#6C52FF' }]);
    const updateEntry = (i: number, p: Partial<TogglEntry>) =>
        setEntries(entries.map((e, idx) => (idx === i ? { ...e, ...p } : e)));
    const removeEntry = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));

    // Spotlight
    const spotlight = local.spotlight ?? {};
    const setSpotlight = (s: SpotlightConfig) => patch({ spotlight: s });

    // Moment
    const moment = local.moment ?? {};
    const setMoment = (m: MomentConfig) => patch({ moment: m });

    return (
        <div className="space-y-6">

            {/* Toggl Leaderboard */}
            <section className="space-y-4">
                <SectionTitle>Toggl Leaderboard</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Titel">
                        <TextInput
                            value={local.toggl?.title ?? ''}
                            onChange={(e) => patch({ toggl: { ...local.toggl, title: e.target.value } })}
                            placeholder="Toggl Leaderboard"
                        />
                    </Field>
                    <Field label="Ondertitel">
                        <TextInput
                            value={local.toggl?.subtitle ?? ''}
                            onChange={(e) => patch({ toggl: { ...local.toggl, subtitle: e.target.value } })}
                            placeholder="deze week"
                        />
                    </Field>
                </div>
                <div className="space-y-2">
                    {entries.map((entry, i) => (
                        <RowCard key={i} onDelete={() => removeEntry(i)}>
                            <div className="grid grid-cols-[1fr_80px_36px] gap-2 items-end">
                                <Field label="Naam">
                                    <TextInput
                                        value={entry.name}
                                        onChange={(e) => updateEntry(i, { name: e.target.value })}
                                        placeholder="Jan de Vries"
                                    />
                                </Field>
                                <Field label="Uren">
                                    <NumberInput
                                        value={entry.hours}
                                        onChange={(e) => updateEntry(i, { hours: Number(e.target.value) })}
                                        min={0}
                                        step={0.5}
                                        placeholder="40"
                                    />
                                </Field>
                                <div className="pb-0.5">
                                    <input
                                        type="color"
                                        value={entry.color ?? '#6C52FF'}
                                        onChange={(e) => updateEntry(i, { color: e.target.value })}
                                        className="h-9 w-9 rounded-lg border border-[#e6e2f4] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </RowCard>
                    ))}
                    <AddButton onClick={addEntry} label="Persoon toevoegen" />
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
                        placeholder="Teamborrel"
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
            <section className="space-y-4">
                <SectionTitle>Moonly Moment</SectionTitle>
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
                        placeholder="Wat een geweldige dag!"
                    />
                </Field>
                <Field label="Foto URL">
                    <TextInput
                        value={moment.photo ?? ''}
                        onChange={(e) => setMoment({ ...moment, photo: e.target.value })}
                        placeholder="https://..."
                    />
                </Field>
            </section>

            <div className="pt-2">
                <SaveButton onClick={save} saving={saving} saved={saved} />
            </div>
        </div>
    );
}
