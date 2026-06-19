import { Backdrop, TopBar, AppBar, useClock } from '@/Components/Display/Shell';
import type { ScreenConfig, ServiceConfig, LiveMatch, Fixture } from '@/types';

interface TechnicalDisplayProps {
    screenConfig?: ScreenConfig;
}

const STAT: Record<string, { c: string; label: string }> = {
    up:   { c: '#27DD36', label: 'Operationeel' },
    warn: { c: '#FFB020', label: 'Verstoord' },
    down: { c: '#DD2727', label: 'Storing' },
};

function ServiceTile({ s }: { s: ServiceConfig }) {
    const t = STAT[s.status] || STAT.up;
    return (
        <div
            className="reveal relative rounded-[26px] p-7 flex items-center gap-6 overflow-hidden"
            style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${t.c}44` }}
        >
            <span className="absolute left-0 top-0 bottom-0 w-[8px]" style={{ background: t.c, boxShadow: `0 0 26px ${t.c}` }} />
            <span
                className="h-[26px] w-[26px] rounded-full shrink-0"
                style={{
                    background: t.c,
                    boxShadow: `0 0 20px ${t.c}`,
                    animation: s.status === 'down' ? 'ringpulse 1.6s infinite' : s.status === 'warn' ? 'blink 1.6s infinite' : 'none',
                }}
            />
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white text-[40px] leading-none truncate">{s.name}</div>
                <div className="text-white/45 text-[24px] font-semibold mt-2 truncate">{s.kind}</div>
            </div>
            <div className="text-right shrink-0">
                <div className="font-display font-bold text-[30px] leading-none whitespace-nowrap" style={{ color: t.c }}>{t.label}</div>
                <div className="text-white/55 text-[23px] font-semibold mt-2 whitespace-nowrap max-w-[280px] truncate">{s.note}</div>
            </div>
        </div>
    );
}

function LiveCard({ m }: { m: LiveMatch }) {
    return (
        <div
            className="reveal relative rounded-[26px] p-6 overflow-hidden"
            style={{ background: 'linear-gradient(150deg,rgba(221,39,39,.16),rgba(15,11,38,.4))', border: '1px solid rgba(221,39,39,.4)' }}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-white/55 text-[24px] font-bold uppercase tracking-wide truncate">{m.comp}</span>
                <span
                    className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-white font-extrabold text-[22px]"
                    style={{ background: '#DD2727' }}
                >
                    <span className="h-2.5 w-2.5 rounded-full bg-white" style={{ animation: 'blink 1s infinite' }} />
                    LIVE {m.min}
                </span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="font-display font-bold text-white text-[42px] leading-none flex-1 truncate">{m.home}</span>
                <span className="font-display font-bold text-white text-[58px] leading-none tabular-nums px-5">
                    {m.hs} <span className="text-white/40">–</span> {m.as}
                </span>
                <span className="font-display font-bold text-white text-[42px] leading-none flex-1 text-right truncate">{m.away}</span>
            </div>
        </div>
    );
}

function FixtureRow({ f }: { f: Fixture }) {
    return (
        <div
            className="reveal flex items-center gap-5 rounded-[22px] px-6 py-3.5"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}
        >
            <div className="shrink-0 w-[112px] text-center">
                <span
                    className="inline-block rounded-full px-4 py-1.5 text-[20px] font-extrabold uppercase tracking-wide"
                    style={{ background: 'rgba(108,82,255,.2)', color: '#B5A9FF' }}
                >
                    {f.comp}
                </span>
            </div>
            <div className="flex-1 min-w-0 font-display font-bold text-white text-[33px] leading-tight truncate">{f.label}</div>
            <div className="shrink-0 font-display font-bold text-[#05BFDB] text-[30px] whitespace-nowrap">{f.when}</div>
        </div>
    );
}

function SummaryStat({ c, n, label }: { c: string; n: number; label: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="font-display font-bold text-[44px] leading-none tabular-nums" style={{ color: c }}>{n}</span>
            <span className="text-white/60 text-[26px] font-semibold">{label}</span>
        </div>
    );
}

export default function TechnicalDisplay({ screenConfig }: TechnicalDisplayProps) {
    const rooms = screenConfig?.rooms ?? [];
    const weather = screenConfig?.weather;
    const services: ServiceConfig[] = screenConfig?.services ?? [];
    const live: LiveMatch[] = screenConfig?.live ?? [];
    const fixtures: Fixture[] = screenConfig?.fixtures ?? [];
    const sportTitle = screenConfig?.sportTitle || 'Sport';

    const counts = services.reduce<Record<string, number>>((a, s) => {
        a[s.status] = (a[s.status] || 0) + 1;
        return a;
    }, {});
    const overall = counts.down
        ? { c: '#DD2727', t: 'Storing actief' }
        : counts.warn
        ? { c: '#FFB020', t: 'Verstoringen' }
        : { c: '#27DD36', t: 'Alles operationeel' };

    const now = useClock();
    const synced = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return (
        <div className="absolute inset-0 flex flex-col text-white">
            <Backdrop />
            <div className="relative z-10 flex flex-col h-full">
                <TopBar weather={weather} />

                <main className="flex-1 min-h-0 px-12 py-2 grid gap-8" style={{ gridTemplateColumns: '1.12fr 0.88fr' }}>
                    {/* Left: system status */}
                    <section className="min-h-0 flex flex-col">
                        <div className="flex items-end justify-between mb-6">
                            <div className="reveal">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="h-[14px] w-[14px] rounded-full"
                                        style={{ background: overall.c, boxShadow: `0 0 22px ${overall.c}` }} />
                                    <span className="uppercase tracking-[.34em] text-[#B5A9FF]/80 font-bold text-[26px] whitespace-nowrap">
                                        Systeemstatus
                                    </span>
                                </div>
                                <h1 className="font-display font-bold text-white leading-[0.98] text-[82px] whitespace-nowrap">Systemen</h1>
                            </div>
                            <div
                                className="reveal flex items-center gap-3 rounded-full px-7 py-4"
                                style={{ background: `${overall.c}1f`, border: `2px solid ${overall.c}` }}
                            >
                                <span className="h-4 w-4 rounded-full" style={{ background: overall.c, animation: 'pulsedot 1.8s infinite' }} />
                                <span className="font-display font-bold text-[34px] leading-none" style={{ color: overall.c }}>{overall.t}</span>
                            </div>
                        </div>
                        <div className="flex-1 grid gap-5 min-h-0"
                            style={{ gridTemplateRows: `repeat(${Math.max(services.length, 1)}, minmax(0, 1fr))` }}>
                            {services.map((s) => <ServiceTile key={s.id} s={s} />)}
                            {services.length === 0 && (
                                <div className="flex items-center justify-center text-white/30 text-[32px]">
                                    Configureer services in scherm-instellingen
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right: sport */}
                    <section className="min-h-0 flex flex-col">
                        <div className="flex items-end justify-between mb-6">
                            <div className="reveal">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="h-[14px] w-[14px] rounded-full bg-[#FF4490]"
                                        style={{ boxShadow: '0 0 22px #FF4490' }} />
                                    <span className="uppercase tracking-[.34em] text-[#B5A9FF]/80 font-bold text-[26px] whitespace-nowrap">
                                        Sport & events
                                    </span>
                                </div>
                                <h1 className="font-display font-bold text-white leading-[0.98] text-[82px] whitespace-nowrap">{sportTitle}</h1>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 min-h-0 flex-1">
                            {live.map((m) => <LiveCard key={m.id} m={m} />)}
                            <div className="flex items-center gap-3 mt-1">
                                <span className="uppercase tracking-[.26em] text-[#B5A9FF]/80 font-bold text-[22px] whitespace-nowrap">
                                    Komende events
                                </span>
                                <span className="flex-1 h-px bg-white/12" />
                            </div>
                            <div className="flex flex-col gap-3 flex-1 min-h-0">
                                {fixtures.map((f) => <FixtureRow key={f.id} f={f} />)}
                                {fixtures.length === 0 && live.length === 0 && (
                                    <div className="flex items-center justify-center text-white/30 text-[28px]">
                                        Configureer sport in scherm-instellingen
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                {/* Status summary footer */}
                <footer className="shrink-0 px-12 pb-5 pt-1">
                    <div className="panel rounded-[26px] flex items-center justify-between px-9 py-4">
                        <div className="flex items-center gap-8">
                            <SummaryStat c="#27DD36" n={counts.up || 0} label="Operationeel" />
                            <SummaryStat c="#FFB020" n={counts.warn || 0} label="Verstoord" />
                            <SummaryStat c="#DD2727" n={counts.down || 0} label="Storing" />
                        </div>
                        <div className="flex items-center gap-3 text-white/55 text-[26px] font-semibold">
                            <span className="h-3 w-3 rounded-full bg-[#27DD36]" style={{ animation: 'pulsedot 1.8s infinite' }} />
                            Laatst bijgewerkt {synced} · ververst automatisch
                        </div>
                    </div>
                </footer>

                <AppBar rooms={rooms} />
            </div>
        </div>
    );
}
