import { useState } from 'react';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';
import { Field, TextInput, Segmented, RowCard, AddButton, SaveButton, SectionTitle, Divider } from './Ui';

interface ServiceConfig {
    name: string;
    status: 'up' | 'warn' | 'down';
    url?: string;
}

interface LiveMatch {
    home: string;
    away: string;
    scoreHome: number;
    scoreAway: number;
    minute?: string;
}

interface Fixture {
    home: string;
    away: string;
    when: string;
}

interface Props {
    screenId: number;
    screenConfig: Record<string, any>;
    onConfigChange: (cfg: Record<string, any>) => void;
}

const STATUS_OPTIONS = [
    { value: 'up', label: '✓ Up' },
    { value: 'warn', label: '⚠ Warn' },
    { value: 'down', label: '✕ Down' },
];

export function TechnicalEditor({ screenId, screenConfig, onConfigChange }: Props) {
    const [services, setServices] = useState<ServiceConfig[]>(screenConfig.services ?? []);
    const [live, setLive] = useState<LiveMatch[]>(screenConfig.live ?? []);
    const [fixtures, setFixtures] = useState<Fixture[]>(screenConfig.fixtures ?? []);
    const [sportTitle, setSportTitle] = useState<string>(screenConfig.sportTitle ?? 'Sport & Events');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(route('screens.updateConfig', screenId), {
                screen_config: { ...screenConfig, services, live, fixtures, sportTitle },
            });
            onConfigChange(res.data.screen_config);
            notifyDisplayRefresh(screenId);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    // Services
    const addService = () => setServices([...services, { name: '', status: 'up', url: '' }]);
    const updateService = (i: number, p: Partial<ServiceConfig>) =>
        setServices(services.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
    const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));

    // Live matches
    const addMatch = () => setLive([...live, { home: '', away: '', scoreHome: 0, scoreAway: 0, minute: '' }]);
    const updateMatch = (i: number, p: Partial<LiveMatch>) =>
        setLive(live.map((m, idx) => (idx === i ? { ...m, ...p } : m)));
    const removeMatch = (i: number) => setLive(live.filter((_, idx) => idx !== i));

    // Fixtures
    const addFixture = () => setFixtures([...fixtures, { home: '', away: '', when: '' }]);
    const updateFixture = (i: number, p: Partial<Fixture>) =>
        setFixtures(fixtures.map((f, idx) => (idx === i ? { ...f, ...p } : f)));
    const removeFixture = (i: number) => setFixtures(fixtures.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-6">

            {/* Services */}
            <section className="space-y-4">
                <SectionTitle>Services</SectionTitle>
                <div className="space-y-3">
                    {services.map((svc, i) => (
                        <RowCard key={i} onDelete={() => removeService(i)}>
                            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                                <Field label="Naam">
                                    <TextInput
                                        value={svc.name}
                                        onChange={(e) => updateService(i, { name: e.target.value })}
                                        placeholder="API Gateway"
                                    />
                                </Field>
                                <Field label="Status">
                                    <Segmented
                                        options={STATUS_OPTIONS as any}
                                        value={svc.status}
                                        onChange={(v) => updateService(i, { status: v as ServiceConfig['status'] })}
                                    />
                                </Field>
                            </div>
                            <Field label="URL (optioneel)">
                                <TextInput
                                    value={svc.url ?? ''}
                                    onChange={(e) => updateService(i, { url: e.target.value })}
                                    placeholder="https://api.example.com/health"
                                />
                            </Field>
                        </RowCard>
                    ))}
                    <AddButton onClick={addService} label="Service toevoegen" />
                </div>
            </section>

            <Divider />

            {/* Sport title */}
            <section className="space-y-4">
                <SectionTitle>Sport & Events</SectionTitle>
                <Field label="Sectietitel">
                    <TextInput
                        value={sportTitle}
                        onChange={(e) => setSportTitle(e.target.value)}
                        placeholder="Sport & Events"
                    />
                </Field>
            </section>

            {/* Live matches */}
            <section className="space-y-3">
                <p className="text-xs font-semibold text-[#5b5478] uppercase tracking-wide">Live wedstrijden</p>
                {live.map((match, i) => (
                    <RowCard key={i} onDelete={() => removeMatch(i)}>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                            <Field label="Thuis">
                                <TextInput
                                    value={match.home}
                                    onChange={(e) => updateMatch(i, { home: e.target.value })}
                                    placeholder="Ajax"
                                />
                            </Field>
                            <div className="flex gap-1 pb-0.5">
                                <input
                                    type="number"
                                    value={match.scoreHome}
                                    onChange={(e) => updateMatch(i, { scoreHome: Number(e.target.value) })}
                                    className="w-10 rounded-lg border border-[#e6e2f4] bg-white px-2 py-2 text-center text-sm font-bold text-[#1a1430]"
                                />
                                <span className="self-center text-[#b0abc8] font-bold">–</span>
                                <input
                                    type="number"
                                    value={match.scoreAway}
                                    onChange={(e) => updateMatch(i, { scoreAway: Number(e.target.value) })}
                                    className="w-10 rounded-lg border border-[#e6e2f4] bg-white px-2 py-2 text-center text-sm font-bold text-[#1a1430]"
                                />
                            </div>
                            <Field label="Uit">
                                <TextInput
                                    value={match.away}
                                    onChange={(e) => updateMatch(i, { away: e.target.value })}
                                    placeholder="PSV"
                                />
                            </Field>
                        </div>
                        <Field label="Minuut">
                            <TextInput
                                value={match.minute ?? ''}
                                onChange={(e) => updateMatch(i, { minute: e.target.value })}
                                placeholder="73'"
                            />
                        </Field>
                    </RowCard>
                ))}
                <AddButton onClick={addMatch} label="Live wedstrijd toevoegen" />
            </section>

            {/* Fixtures */}
            <section className="space-y-3">
                <p className="text-xs font-semibold text-[#5b5478] uppercase tracking-wide">Programma</p>
                {fixtures.map((fix, i) => (
                    <RowCard key={i} onDelete={() => removeFixture(i)}>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                            <Field label="Thuis">
                                <TextInput
                                    value={fix.home}
                                    onChange={(e) => updateFixture(i, { home: e.target.value })}
                                    placeholder="Feyenoord"
                                />
                            </Field>
                            <div className="self-end pb-2 text-xs font-semibold text-[#b0abc8]">vs</div>
                            <Field label="Uit">
                                <TextInput
                                    value={fix.away}
                                    onChange={(e) => updateFixture(i, { away: e.target.value })}
                                    placeholder="Utrecht"
                                />
                            </Field>
                        </div>
                        <Field label="Wanneer">
                            <TextInput
                                value={fix.when}
                                onChange={(e) => updateFixture(i, { when: e.target.value })}
                                placeholder="Za 20:00"
                            />
                        </Field>
                    </RowCard>
                ))}
                <AddButton onClick={addFixture} label="Wedstrijd toevoegen" />
            </section>

            <div className="pt-2">
                <SaveButton onClick={save} saving={saving} saved={saved} />
            </div>
        </div>
    );
}
