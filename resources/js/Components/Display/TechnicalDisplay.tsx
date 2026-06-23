import { useEffect, useState } from "react";
import { Backdrop, TopBar, AppBar, useClock } from "@/Components/Display/Shell";
import type { ScreenConfig, ServiceConfig, LiveMatch, Fixture } from "@/types";

interface TechnicalDisplayProps {
    screenConfig?: ScreenConfig;
}

const STAT: Record<string, { c: string; label: string }> = {
    up: { c: "#27DD36", label: "Operationeel" },
    warn: { c: "#FFB020", label: "Verstoord" },
    down: { c: "#DD2727", label: "Storing" },
};

function ServiceTile({ s }: { s: ServiceConfig }) {
    const t = STAT[s.status] || STAT.up;
    return (
        <div
            className="reveal relative rounded-[26px] p-7 flex items-center gap-6 overflow-hidden"
            style={{
                background: "rgba(255,255,255,.04)",
                border: `1px solid ${t.c}44`,
            }}
        >
            <span
                className="absolute left-0 top-0 bottom-0 w-[8px]"
                style={{ background: t.c, boxShadow: `0 0 26px ${t.c}` }}
            />
            <span
                className="h-[26px] w-[26px] rounded-full shrink-0"
                style={{
                    background: t.c,
                    boxShadow: `0 0 20px ${t.c}`,
                    animation:
                        s.status === "down"
                            ? "ringpulse 1.6s infinite"
                            : s.status === "warn"
                              ? "blink 1.6s infinite"
                              : "none",
                }}
            />
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white text-[40px] leading-none truncate">
                    {s.name}
                </div>
                <div className="text-white/45 text-[24px] font-semibold mt-2 truncate">
                    {s.kind}
                </div>
            </div>
            <div className="text-right shrink-0">
                <div
                    className="font-display font-bold text-[30px] leading-none whitespace-nowrap"
                    style={{ color: t.c }}
                >
                    {t.label}
                </div>
                <div className="text-white/55 text-[23px] font-semibold mt-2 whitespace-nowrap max-w-[280px] truncate">
                    {s.note}
                </div>
            </div>
        </div>
    );
}

function LiveCard({ m }: { m: LiveMatch }) {
    return (
        <div
            className="reveal relative rounded-[26px] p-6 overflow-hidden"
            style={{
                background:
                    "linear-gradient(150deg,rgba(221,39,39,.16),rgba(15,11,38,.4))",
                border: "1px solid rgba(221,39,39,.4)",
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-white/55 text-[24px] font-bold uppercase tracking-wide truncate">
                    {m.comp}
                </span>
                <span
                    className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-white font-extrabold text-[22px]"
                    style={{ background: "#DD2727" }}
                >
                    <span
                        className="h-2.5 w-2.5 rounded-full bg-white"
                        style={{ animation: "blink 1s infinite" }}
                    />
                    LIVE {m.min}
                </span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="font-display font-bold text-white text-[42px] leading-none flex-1 truncate">
                    {m.home}
                </span>
                <span className="font-display font-bold text-white text-[58px] leading-none tabular-nums px-5">
                    {m.hs} <span className="text-white/40">–</span> {m.as}
                </span>
                <span className="font-display font-bold text-white text-[42px] leading-none flex-1 text-right truncate">
                    {m.away}
                </span>
            </div>
        </div>
    );
}

function FixtureRow({ f }: { f: Fixture }) {
    return (
        <div
            className="reveal flex items-center gap-5 rounded-[22px] px-6 py-3.5"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
            }}
        >
            <div className="shrink-0 w-[112px] text-center">
                <span
                    className="inline-block rounded-full px-4 py-1.5 text-[20px] font-extrabold uppercase tracking-wide"
                    style={{
                        background: "rgba(108,82,255,.2)",
                        color: "#B5A9FF",
                    }}
                >
                    {f.comp}
                </span>
            </div>
            <div className="flex-1 min-w-0 font-display font-bold text-white text-[33px] leading-tight truncate">
                {f.label}
            </div>
            <div className="shrink-0 font-display font-bold text-[#05BFDB] text-[30px] whitespace-nowrap">
                {f.when}
            </div>
        </div>
    );
}

function SummaryStat({ c, n, label }: { c: string; n: number; label: string }) {
    return (
        <div className="flex items-center gap-3">
            <span
                className="font-display font-bold text-[44px] leading-none tabular-nums"
                style={{ color: c }}
            >
                {n}
            </span>
            <span className="text-white/60 text-[26px] font-semibold">
                {label}
            </span>
        </div>
    );
}

// ─── F1 components ─────────────────────────────────────────────────────────────

interface F1Standing {
    position: number;
    driver: { id?: number; name: string; abbr?: string };
    team?: { name: string };
    points: number;
}

interface F1Race {
    competition: { name: string; location?: { country?: string } };
    circuit?: { name: string };
    date: string;
    time?: string;
}

function F1DriverRow({ s }: { s: F1Standing }) {
    const podiumColors: Record<number, string> = {
        1: "#FFD700",
        2: "#C0C0C0",
        3: "#CD7F32",
    };
    const c = podiumColors[s.position] ?? "rgba(255,255,255,.55)";
    return (
        <div
            className="reveal flex items-center gap-4 rounded-[20px] px-5 py-2.5"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
            }}
        >
            <span
                className="font-display font-bold text-[26px] w-7 text-center tabular-nums shrink-0"
                style={{ color: c }}
            >
                {s.position}
            </span>
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white text-[26px] leading-none truncate">
                    {s.driver.name}
                </div>
                {s.team && (
                    <div className="text-white/45 text-[18px] truncate">
                        {s.team.name}
                    </div>
                )}
            </div>
            <span className="font-display font-bold text-[#05BFDB] text-[26px] tabular-nums shrink-0">
                {s.points}
            </span>
        </div>
    );
}

function F1NextRaceCard({ race }: { race: F1Race }) {
    const d = new Date(`${race.date}T${race.time ?? "12:00:00"}`);
    const when = d.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    const timeStr = race.time
        ? " · " +
          d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
        : "";
    return (
        <div
            className="reveal rounded-[22px] px-5 py-4"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(108,82,255,.3)",
            }}
        >
            <div className="text-[#B5A9FF]/70 text-[18px] font-bold uppercase tracking-wide mb-1">
                Volgende race
            </div>
            <div className="font-display font-bold text-white text-[30px] leading-tight truncate">
                {race.competition.name}
            </div>
            {race.circuit?.name && (
                <div className="text-white/50 text-[20px] truncate">
                    {race.circuit.name}
                </div>
            )}
            <div className="text-[#05BFDB] font-bold text-[22px] mt-1">
                {when}
                {timeStr}
            </div>
        </div>
    );
}

// ─── Sport data hook ────────────────────────────────────────────────────────────

const FOOTBALL_API_KEY = "";
const WC_LEAGUE_ID = 1;
const SPORT_SEASON = 2026;

function useSportData() {
    const [wcLive, setWcLive] = useState<LiveMatch[]>([]);
    const [wcUpcoming, setWcUpcoming] = useState<Fixture[]>([]);
    const [f1Standings, setF1Standings] = useState<F1Standing[]>([]);
    const [f1NextRace, setF1NextRace] = useState<F1Race | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchFootball = async () => {
        try {
            const headers = { "x-apisports-key": FOOTBALL_API_KEY };

            const [liveRes, upcomingRes] = await Promise.all([
                fetch(
                    `https://v3.football.api-sports.io/fixtures?live=all&league=${WC_LEAGUE_ID}`,
                    { headers },
                ),
                fetch(
                    `https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE_ID}&season=${SPORT_SEASON}&next=5`,
                    { headers },
                ),
            ]);

            const liveData = await liveRes.json();
            setWcLive(
                (liveData.response ?? []).map(
                    (f: any): LiveMatch => ({
                        id: String(f.fixture.id),
                        comp: "WK",
                        home: f.teams.home.name,
                        away: f.teams.away.name,
                        hs: f.goals?.home ?? 0,
                        as: f.goals?.away ?? 0,
                        min: `${f.fixture.status.elapsed ?? "?"}'`,
                    }),
                ),
            );

            const upcomingData = await upcomingRes.json();
            setWcUpcoming(
                (upcomingData.response ?? []).map((f: any): Fixture => {
                    const d = new Date(f.fixture.date);
                    return {
                        id: String(f.fixture.id),
                        comp: "WK",
                        label: `${f.teams.home.name} – ${f.teams.away.name}`,
                        when:
                            d.toLocaleDateString("nl-NL", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                            }) +
                            " " +
                            d.toLocaleTimeString("nl-NL", {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                    };
                }),
            );
        } catch (e) {
            console.error("[Sport] Football API error:", e);
        }
    };

    const fetchF1 = async () => {
        try {
            const headers = { "x-apisports-key": FOOTBALL_API_KEY };

            const [standingsRes, racesRes] = await Promise.all([
                fetch(
                    `https://v1.formula-1.api-sports.io/rankings/drivers?season=${SPORT_SEASON}`,
                    { headers },
                ),
                fetch(
                    `https://v1.formula-1.api-sports.io/races?season=${SPORT_SEASON}&type=Race`,
                    { headers },
                ),
            ]);

            const standingsData = await standingsRes.json();
            setF1Standings(
                (standingsData.response ?? []).slice(0, 5).map(
                    (s: any): F1Standing => ({
                        position: s.position,
                        driver: {
                            id: s.driver?.id,
                            name: s.driver?.name ?? "—",
                            abbr: s.driver?.abbr,
                        },
                        team: s.team ? { name: s.team.name } : undefined,
                        points: Number(s.points ?? 0),
                    }),
                ),
            );

            const racesData = await racesRes.json();
            const now = Date.now();
            const next =
                (racesData.response ?? []).find((r: any) => {
                    const raceDate = new Date(
                        `${r.date}T${r.time ?? "12:00:00"}`,
                    );
                    return raceDate.getTime() > now;
                }) ?? null;
            setF1NextRace(next);
        } catch (e) {
            console.error("[Sport] F1 API error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFootball();
        fetchF1();
        const wcInterval = setInterval(fetchFootball, 60_000);
        const f1Interval = setInterval(fetchF1, 5 * 60_000);
        return () => {
            clearInterval(wcInterval);
            clearInterval(f1Interval);
        };
    }, []);

    return { wcLive, wcUpcoming, f1Standings, f1NextRace, loading };
}

// ─── Main display ──────────────────────────────────────────────────────────────

export default function TechnicalDisplay({
    screenConfig,
}: TechnicalDisplayProps) {
    const rooms = screenConfig?.rooms ?? [];
    const weather = screenConfig?.weather;
    const services: ServiceConfig[] = screenConfig?.services ?? [];
    const sportTitle = screenConfig?.sportTitle || "Sport";

    const { wcLive, wcUpcoming, f1Standings, f1NextRace, loading } =
        useSportData();

    const livesToShow = wcLive.slice(0, 2);
    const fixturesToShow = wcUpcoming.slice(
        0,
        Math.max(0, 4 - livesToShow.length),
    );

    const counts = services.reduce<Record<string, number>>((a, s) => {
        a[s.status] = (a[s.status] || 0) + 1;
        return a;
    }, {});
    const overall = counts.down
        ? { c: "#DD2727", t: "Storing actief" }
        : counts.warn
          ? { c: "#FFB020", t: "Verstoringen" }
          : { c: "#27DD36", t: "Alles operationeel" };

    const now = useClock();
    const synced = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return (
        <div className="absolute inset-0 flex flex-col text-white">
            <Backdrop />
            <div className="relative z-10 flex flex-col h-full">
                <TopBar weather={weather} />

                <main
                    className="flex-1 min-h-0 px-12 py-2 grid gap-8"
                    style={{ gridTemplateColumns: "1.12fr 0.88fr" }}
                >
                    {/* Left: system status */}
                    <section className="min-h-0 flex flex-col">
                        <div className="flex items-end justify-between mb-6">
                            <div className="reveal">
                                <div className="flex items-center gap-4 mb-3">
                                    <span
                                        className="h-[14px] w-[14px] rounded-full"
                                        style={{
                                            background: overall.c,
                                            boxShadow: `0 0 22px ${overall.c}`,
                                        }}
                                    />
                                    <span className="uppercase tracking-[.34em] text-[#B5A9FF]/80 font-bold text-[26px] whitespace-nowrap">
                                        Systeemstatus
                                    </span>
                                </div>
                                <h1 className="font-display font-bold text-white leading-[0.98] text-[82px] whitespace-nowrap">
                                    Systemen
                                </h1>
                            </div>
                            <div
                                className="reveal flex items-center gap-3 rounded-full px-7 py-4"
                                style={{
                                    background: `${overall.c}1f`,
                                    border: `2px solid ${overall.c}`,
                                }}
                            >
                                <span
                                    className="h-4 w-4 rounded-full"
                                    style={{
                                        background: overall.c,
                                        animation: "pulsedot 1.8s infinite",
                                    }}
                                />
                                <span
                                    className="font-display font-bold text-[34px] leading-none"
                                    style={{ color: overall.c }}
                                >
                                    {overall.t}
                                </span>
                            </div>
                        </div>
                        <div
                            className="flex-1 grid gap-5 min-h-0"
                            style={{
                                gridTemplateRows: `repeat(${Math.max(services.length, 1)}, minmax(0, 1fr))`,
                            }}
                        >
                            {services.map((s) => (
                                <ServiceTile key={s.id} s={s} />
                            ))}
                            {services.length === 0 && (
                                <div className="flex items-center justify-center text-white/30 text-[32px]">
                                    Configureer services in scherm-instellingen
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right: sport */}
                    <section className="min-h-0 flex flex-col">
                        <div className="flex items-end justify-between mb-5">
                            <div className="reveal">
                                <div className="flex items-center gap-4 mb-3">
                                    <span
                                        className="h-[14px] w-[14px] rounded-full bg-[#FF4490]"
                                        style={{
                                            boxShadow: "0 0 22px #FF4490",
                                        }}
                                    />
                                    <span className="uppercase tracking-[.34em] text-[#B5A9FF]/80 font-bold text-[26px] whitespace-nowrap">
                                        Sport & events
                                    </span>
                                </div>
                                <h1 className="font-display font-bold text-white leading-[0.98] text-[82px] whitespace-nowrap">
                                    {sportTitle}
                                </h1>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden">
                            {/* World Cup */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-[22px]">⚽</span>
                                    <span className="uppercase tracking-[.22em] text-[#B5A9FF]/70 font-bold text-[20px]">
                                        FIFA Wereldkampioenschap
                                    </span>
                                    <span className="flex-1 h-px bg-white/10" />
                                </div>
                                {livesToShow.map((m) => (
                                    <LiveCard key={m.id} m={m} />
                                ))}
                                {fixturesToShow.map((f) => (
                                    <FixtureRow key={f.id} f={f} />
                                ))}
                                {!loading &&
                                    livesToShow.length === 0 &&
                                    fixturesToShow.length === 0 && (
                                        <div className="text-white/30 text-[24px] text-center py-2">
                                            Geen wedstrijden gevonden
                                        </div>
                                    )}
                            </div>

                            {/* Formula 1 */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-[22px]">🏎</span>
                                    <span className="uppercase tracking-[.22em] text-[#B5A9FF]/70 font-bold text-[20px]">
                                        Formule 1 — {SPORT_SEASON}
                                    </span>
                                    <span className="flex-1 h-px bg-white/10" />
                                </div>
                                {f1NextRace && (
                                    <F1NextRaceCard race={f1NextRace} />
                                )}
                                {f1Standings.map((s, i) => (
                                    <F1DriverRow
                                        key={s.driver?.id ?? i}
                                        s={s}
                                    />
                                ))}
                                {!loading && f1Standings.length === 0 && (
                                    <div className="text-white/30 text-[24px] text-center py-2">
                                        Geen klassement gevonden
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
                            <SummaryStat
                                c="#27DD36"
                                n={counts.up || 0}
                                label="Operationeel"
                            />
                            <SummaryStat
                                c="#FFB020"
                                n={counts.warn || 0}
                                label="Verstoord"
                            />
                            <SummaryStat
                                c="#DD2727"
                                n={counts.down || 0}
                                label="Storing"
                            />
                        </div>
                        <div className="flex items-center gap-3 text-white/55 text-[26px] font-semibold">
                            <span
                                className="h-3 w-3 rounded-full bg-[#27DD36]"
                                style={{ animation: "pulsedot 1.8s infinite" }}
                            />
                            Laatst bijgewerkt {synced} · ververst automatisch
                        </div>
                    </div>
                </footer>

                <AppBar rooms={rooms} />
            </div>
        </div>
    );
}
