import { useEffect, useState } from "react";
import { Backdrop, TopBar, AppBar, useClock } from "@/Components/Display/Shell";
import type {
    ScreenConfig,
    ServiceConfig,
    LiveMatch,
    Fixture,
    ArgoCDApp,
    F1NextRace,
    F1RaceResult,
} from "@/types";

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
            className="reveal relative flex items-center gap-5 rounded-[22px] px-6 py-3 overflow-hidden"
            style={{
                background:
                    "linear-gradient(150deg,rgba(221,39,39,.14),rgba(15,11,38,.35))",
                border: "1px solid rgba(221,39,39,.35)",
            }}
        >
            <div className="flex-1 min-w-0">
                <div className="text-white/40 text-[13px] font-semibold truncate mb-0.5 tracking-wide">
                    {m.comp}
                </div>
                <div className="font-display font-bold text-white/80 text-[21px] leading-tight truncate">
                    {m.home} – {m.away}
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
                <span className="font-display font-bold text-white text-[21px] tabular-nums whitespace-nowrap">
                    {m.hs} <span className="text-white/40">–</span> {m.as}
                </span>
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-white font-bold text-[13px] whitespace-nowrap"
                    style={{ background: "#DD2727" }}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-white"
                        style={{ animation: "blink 1s infinite" }}
                    />
                    LIVE{m.min ? ` ${m.min}` : ""}
                </span>
            </div>
        </div>
    );
}

function FixtureRow({ f }: { f: Fixture }) {
    return (
        <div
            className="reveal flex items-center gap-5 rounded-[22px] px-6 py-3"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
            }}
        >
            <div className="flex-1 min-w-0">
                <div className="text-white/40 text-[13px] font-semibold truncate mb-0.5 tracking-wide">
                    {f.comp}
                </div>
                <div className="font-display font-bold text-white/80 text-[21px] leading-tight truncate">
                    {f.label}
                </div>
            </div>
            <div className="shrink-0 font-display font-semibold text-[#05BFDB]/70 text-[18px] whitespace-nowrap">
                {f.when}
            </div>
        </div>
    );
}

function SummaryStat({ c, n, label }: { c: string; n: number; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span
                className="slide-body  tabular-nums leading-none"
                style={{ color: c }}
            >
                {n}
            </span>
            <span className="slide-body-muted">{label}</span>
        </div>
    );
}

// ─── ArgoCD components ─────────────────────────────────────────────────────────

const HEALTH_META: Record<
    ArgoCDApp["health"],
    { c: string; label: string; priority: number }
> = {
    Degraded: { c: "#DD2727", label: "Degraded", priority: 0 },
    Missing: { c: "#FF6B35", label: "Missing", priority: 1 },
    Progressing: { c: "#05BFDB", label: "Progressing", priority: 2 },
    Suspended: { c: "#FFB020", label: "Suspended", priority: 3 },
    Unknown: { c: "#888", label: "Unknown", priority: 4 },
    Healthy: { c: "#27DD36", label: "Healthy", priority: 5 },
};

function appSortKey(app: ArgoCDApp): number {
    const opPenalty =
        app.operation === "Failed" || app.operation === "Error"
            ? -0.6
            : app.operation === "Running"
              ? -0.3
              : 0;
    const h = HEALTH_META[app.health]?.priority ?? 5;
    const syncPenalty =
        app.sync === "OutOfSync" ? -0.4 : app.sync === "Unknown" ? -0.1 : 0;
    return h + opPenalty + syncPenalty;
}

function isCritical(app: ArgoCDApp): boolean {
    return (
        app.health === "Degraded" ||
        app.operation === "Failed" ||
        app.operation === "Error"
    );
}

function ArgoCDHealthBar({ apps }: { apps: ArgoCDApp[] }) {
    const total = apps.length;
    if (total === 0) return null;

    const healthy = apps.filter((a) => a.health === "Healthy").length;
    const pct = Math.round((healthy / total) * 100);
    const barColor =
        pct === 100 ? "#27DD36" : pct >= 90 ? "#FFB020" : "#DD2727";

    return (
        <div
            className="reveal relative rounded-[22px] px-5 py-3.5 overflow-hidden"
            style={{
                background: `${barColor}0c`,
                border: `1px solid ${barColor}30`,
            }}
        >
            <div className="flex items-center gap-5 pl-2">
                <span
                    className="slide-h2 tabular-nums leading-none shrink-0"
                    style={{ color: barColor }}
                >
                    {pct}%
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="slide-body-muted uppercase tracking-[.18em] text-[15px]">
                            Cluster gezondheid
                        </span>
                        <span className="slide-body-muted text-[15px]">
                            {healthy} / {total}
                        </span>
                    </div>
                    <div
                        className="w-full rounded-full overflow-hidden"
                        style={{
                            height: 7,
                            background: "rgba(255,255,255,.10)",
                        }}
                    >
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${pct}%`,
                                background: barColor,
                                boxShadow: `0 0 10px ${barColor}88`,
                                transition: "width .7s ease",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

const SYNC_BADGES: Partial<
    Record<string, { label: string; bg: string; border: string; color: string }>
> = {
    OutOfSync: {
        label: "OutOfSync",
        bg: "rgba(255,176,32,.12)",
        border: "rgba(255,176,32,.28)",
        color: "#FFB020",
    },
    Unknown: {
        label: "Sync?",
        bg: "rgba(136,136,136,.12)",
        border: "rgba(136,136,136,.28)",
        color: "#888",
    },
};

const OP_BADGES: Record<
    string,
    { label: string; bg: string; border: string; color: string }
> = {
    Running: {
        label: "Syncing",
        bg: "rgba(5,191,219,.12)",
        border: "rgba(5,191,219,.28)",
        color: "#05BFDB",
    },
    Failed: {
        label: "Sync failed",
        bg: "rgba(221,39,39,.12)",
        border: "rgba(221,39,39,.28)",
        color: "#DD2727",
    },
    Error: {
        label: "Sync error",
        bg: "rgba(255,107,53,.12)",
        border: "rgba(255,107,53,.28)",
        color: "#FF6B35",
    },
};

function StatusBadge({
    label,
    bg,
    border,
    color,
}: {
    label: string;
    bg: string;
    border: string;
    color: string;
}) {
    return (
        <span
            className="slide-body text-[11px] rounded-full px-2.5 py-px whitespace-nowrap"
            style={{ background: bg, color, border: `1px solid ${border}` }}
        >
            {label}
        </span>
    );
}

function ArgoCDAppRow({ app }: { app: ArgoCDApp }) {
    const h = HEALTH_META[app.health] ?? HEALTH_META.Unknown;
    const syncBadge = app.sync !== "Synced" ? SYNC_BADGES[app.sync] : undefined;
    const opBadge = app.operation ? OP_BADGES[app.operation] : undefined;
    const isProblematic = app.health !== "Healthy" || !!syncBadge || !!opBadge;
    const rowColor =
        syncBadge && app.health === "Healthy"
            ? app.sync === "Unknown"
                ? "#888"
                : "#FFB020"
            : h.c;

    return (
        <div
            className="reveal relative rounded-[18px] px-5 py-2 flex items-center gap-4 overflow-hidden"
            style={{
                background: isProblematic
                    ? `${rowColor}09`
                    : "rgba(255,255,255,.03)",
                border: `1px solid ${isProblematic ? rowColor + "38" : "rgba(255,255,255,.06)"}`,
            }}
        >
            {/* <span
                className="absolute left-0 top-0 bottom-0 w-[5px]"
                style={{
                    background: rowColor,
                    boxShadow: isProblematic ? `0 0 14px ${rowColor}` : "none",
                    opacity: isProblematic ? 1 : 0.3,
                }}
            /> */}
            <span
                className="h-[11px] w-[11px] rounded-full shrink-0"
                style={{
                    background: rowColor,
                    boxShadow: isProblematic ? `0 0 10px ${rowColor}` : "none",
                    opacity: isProblematic ? 1 : 0.45,
                    animation:
                        app.health === "Degraded"
                            ? "ringpulse 1.6s infinite"
                            : app.health === "Progressing" ||
                                opBadge?.label === "Syncing"
                              ? "blink 1.6s infinite"
                              : "none",
                }}
            />
            <div className="flex-1 min-w-0 flex items-baseline gap-3">
                <span className="slide-label text-white truncate leading-none">
                    {app.name}
                </span>
                <span className="slide-body-muted text-[13px] truncate shrink-0">
                    {app.project}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {opBadge && <StatusBadge {...opBadge} />}
                {syncBadge && <StatusBadge {...syncBadge} />}
                {app.health !== "Healthy" && (
                    <span
                        className="slide-label text-[15px] whitespace-nowrap"
                        style={{ color: h.c }}
                    >
                        {h.label}
                    </span>
                )}
            </div>
        </div>
    );
}

const ARGOCD_PAGE_SIZE = 12;

function ArgoCDSection({
    apps,
    allApps,
}: {
    apps: ArgoCDApp[];
    allApps: ArgoCDApp[];
}) {
    const pages = Math.max(1, Math.ceil(apps.length / ARGOCD_PAGE_SIZE));
    const [page, setPage] = useState(0);

    useEffect(() => {
        if (pages <= 1) return;
        const t = setInterval(() => setPage((p) => (p + 1) % pages), 30_000);
        return () => clearInterval(t);
    }, [pages]);

    const pageApps = apps.slice(
        page * ARGOCD_PAGE_SIZE,
        (page + 1) * ARGOCD_PAGE_SIZE,
    );

    return (
        <div className="flex flex-col gap-2">
            <ArgoCDHealthBar apps={allApps} />
            {pageApps.map((app) => (
                <ArgoCDAppRow key={app.name} app={app} />
            ))}
            {pages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                    {Array.from({ length: pages }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-500"
                            style={{
                                width: i === page ? 18 : 5,
                                height: 5,
                                background:
                                    i === page
                                        ? "#B5A9FF"
                                        : "rgba(255,255,255,.18)",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── F1 components ─────────────────────────────────────────────────────────────

function F1DriverRow({ s }: { s: F1RaceResult }) {
    const podiumColors: Record<number, string> = {
        1: "#FFD700",
        2: "#C0C0C0",
        3: "#CD7F32",
    };
    const posColor = podiumColors[s.position] ?? "rgba(255,255,255,.55)";
    const teamColor = s.team?.colour ? `#${s.team.colour}` : null;

    return (
        <div
            className="reveal flex items-center gap-4 rounded-[20px] px-5 py-2.5"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
            }}
        >
            <span
                className="font-display font-bold text-[24px] w-7 text-center tabular-nums shrink-0"
                style={{ color: posColor }}
            >
                {s.position}
            </span>
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white/85 text-[22px] leading-none truncate">
                    {s.driver.name}
                </div>
                {s.team && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {teamColor && (
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: teamColor }}
                            />
                        )}
                        <span className="text-white/40 text-[14px] truncate">
                            {s.team.name}
                        </span>
                    </div>
                )}
            </div>
            {s.driver.abbr && (
                <span className="font-display font-bold text-white/30 text-[18px] tabular-nums shrink-0 tracking-widest">
                    {s.driver.abbr}
                </span>
            )}
        </div>
    );
}

function CircuitOutline({ coords }: { coords: [number, number][] }) {
    if (!coords.length) return null;

    const lons = coords.map(([lon]) => lon);
    const lats = coords.map(([, lat]) => lat);
    const minLon = Math.min(...lons),
        maxLon = Math.max(...lons);
    const minLat = Math.min(...lats),
        maxLat = Math.max(...lats);

    const W = 200,
        H = 120,
        pad = 8;
    const rangeX = maxLon - minLon || 0.001;
    const rangeY = maxLat - minLat || 0.001;
    const scale = Math.min((W - pad * 2) / rangeX, (H - pad * 2) / rangeY);
    const dX = (W - rangeX * scale) / 2;
    const dY = (H - rangeY * scale) / 2;

    const points = coords
        .map(
            ([lon, lat]) =>
                `${dX + (lon - minLon) * scale},${H - dY - (lat - minLat) * scale}`,
        )
        .join(" ");

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            aria-hidden="true"
        >
            <polyline
                points={points}
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function F1NextRaceCard({ race }: { race: F1NextRace }) {
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
            className="reveal rounded-[22px] px-5 py-4 relative overflow-hidden"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(108,82,255,.3)",
            }}
        >
            {race.circuit_coords && race.circuit_coords.length > 0 && (
                <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ width: 140, height: 90, opacity: 0.18 }}
                >
                    <CircuitOutline coords={race.circuit_coords} />
                </div>
            )}
            <div className="text-[#B5A9FF]/70 text-[15px] font-bold uppercase tracking-wide mb-1">
                Volgende race
            </div>
            <div className="font-display font-bold text-white text-[26px] leading-tight truncate pr-36">
                {race.competition.name}
            </div>
            {race.circuit?.name && (
                <div className="text-white/50 text-[16px] truncate pr-36">
                    {race.circuit.name}
                </div>
            )}
            <div className="text-[#05BFDB] font-bold text-[19px] mt-1">
                {when}
                {timeStr}
            </div>
        </div>
    );
}

// ─── Main display ──────────────────────────────────────────────────────────────

export default function TechnicalDisplay({
    screenConfig,
}: TechnicalDisplayProps) {
    const rooms = screenConfig?.rooms ?? [];
    const weather = screenConfig?.weather;
    const services: ServiceConfig[] = screenConfig?.services ?? [];
    const sportTitle = screenConfig?.sportTitle || "Sport";
    const argoCDApps: ArgoCDApp[] = screenConfig?.argocd_apps ?? [];

    const sortedApps = [...argoCDApps].sort(
        (a, b) => appSortKey(a) - appSortKey(b),
    );

    const f1NextRace: F1NextRace | null = screenConfig?.f1_next_race ?? null;
    const f1Results: F1RaceResult[] = screenConfig?.f1_results ?? [];
    const f1ResultsLabel: string | null =
        screenConfig?.f1_results_label ?? null;

    const wcLive: LiveMatch[] = screenConfig?.live ?? [];
    const wcUpcoming: Fixture[] = screenConfig?.fixtures ?? [];

    const livesToShow = wcLive.slice(0, 2);
    const fixturesToShow = wcUpcoming.slice(
        0,
        livesToShow.length > 0 ? Math.max(0, 4 - livesToShow.length) : 2,
    );

    const counts = services.reduce<Record<string, number>>((a, s) => {
        a[s.status] = (a[s.status] || 0) + 1;
        return a;
    }, {});

    const argoCDDegraded = argoCDApps.filter(
        (a) => a.health === "Degraded",
    ).length;
    const argoCDProgressing = argoCDApps.filter(
        (a) => a.health === "Progressing",
    ).length;
    const argoCDOutOfSync = argoCDApps.filter(
        (a) => a.sync === "OutOfSync",
    ).length;
    const argoCDSyncing = argoCDApps.filter(
        (a) => a.operation === "Running",
    ).length;
    const argoCDSyncUnknown = argoCDApps.filter(
        (a) => a.sync === "Unknown",
    ).length;

    const overall =
        argoCDApps.length > 0
            ? argoCDDegraded > 0
                ? {
                      c: "#DD2727",
                      t: `${argoCDDegraded} service${argoCDDegraded > 1 ? "s" : ""} degraded`,
                  }
                : argoCDProgressing > 0
                  ? { c: "#05BFDB", t: `${argoCDProgressing} aan het syncen` }
                  : argoCDOutOfSync > 0
                    ? { c: "#FFB020", t: `${argoCDOutOfSync} out of sync` }
                    : { c: "#27DD36", t: "Alles operationeel" }
            : counts.down
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
                            </div>
                            <div
                                className="reveal flex items-center gap-2.5 rounded-full px-5 py-2.5"
                                style={{
                                    background: `${overall.c}1f`,
                                    border: `2px solid ${overall.c}`,
                                }}
                            >
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                        background: overall.c,
                                        animation: "pulsedot 1.8s infinite",
                                    }}
                                />
                                <span
                                    className="slide-body leading-none font-bold"
                                    style={{ color: overall.c }}
                                >
                                    {overall.t}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col">
                            {/* ArgoCD section */}
                            {argoCDApps.length > 0 && (
                                <ArgoCDSection
                                    apps={sortedApps}
                                    allApps={argoCDApps}
                                />
                            )}

                            {/* Manual services (when no ArgoCD data) */}
                            {argoCDApps.length === 0 && (
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
                                            Configureer services in
                                            scherm-instellingen
                                        </div>
                                    )}
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
                                    <span className="text-[#B5A9FF]/80 font-bold text-[26px] whitespace-nowrap">
                                        Sport & events
                                    </span>
                                </div>
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
                                {livesToShow.length === 0 &&
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
                                        Formule 1
                                    </span>
                                    <span className="flex-1 h-px bg-white/10" />
                                </div>
                                {f1NextRace && (
                                    <F1NextRaceCard race={f1NextRace} />
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                {/* Status summary footer */}
                <footer className="shrink-0 px-12 pb-4 pt-1">
                    <div className="panel rounded-[20px] flex items-center justify-between px-7 py-3">
                        <div className="flex items-center gap-8">
                            {argoCDApps.length > 0 ? (
                                <>
                                    <SummaryStat
                                        c="#27DD36"
                                        n={
                                            argoCDApps.filter(
                                                (a) => a.health === "Healthy",
                                            ).length
                                        }
                                        label="Healthy"
                                    />
                                    <SummaryStat
                                        c="#FFB020"
                                        n={argoCDOutOfSync}
                                        label="OutOfSync"
                                    />
                                    <SummaryStat
                                        c="#DD2727"
                                        n={argoCDDegraded}
                                        label="Degraded"
                                    />
                                    <SummaryStat
                                        c="#05BFDB"
                                        n={argoCDProgressing}
                                        label="Progressing"
                                    />
                                    {argoCDSyncing > 0 && (
                                        <SummaryStat
                                            c="#05BFDB"
                                            n={argoCDSyncing}
                                            label="Syncing"
                                        />
                                    )}
                                    {argoCDSyncUnknown > 0 && (
                                        <SummaryStat
                                            c="#888"
                                            n={argoCDSyncUnknown}
                                            label="Unkown"
                                        />
                                    )}
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5 slide-body-muted">
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
