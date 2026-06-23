import { useEffect, useMemo, useState } from "react";
import type { RoomConfig } from "@/types";

// ---- Gradient helpers ----
const GRADS = [
    "linear-gradient(135deg,#6C52FF,#FF4490)",
    "linear-gradient(135deg,#05BFDB,#6C52FF)",
    "linear-gradient(135deg,#FF73AC,#B5A9FF)",
    "linear-gradient(135deg,#2ac9e0,#826dff)",
    "linear-gradient(135deg,#d73fe8,#6C52FF)",
    "linear-gradient(135deg,#44cfe4,#FF4490)",
];

export function gradFor(seed: string): string {
    const hash = Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0));
    return GRADS[hash % GRADS.length];
}

// ---- Avatar ----
interface AvatarProps {
    name: string;
    size?: number;
    ring?: boolean;
    photo?: string;
}

export function Avatar({ name, size = 96, ring = true, photo }: AvatarProps) {
    const initials = (name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (
        <div
            style={{ width: size, height: size }}
            className="relative shrink-0"
        >
            <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-display font-bold"
                style={{
                    background: gradFor(name),
                    fontSize: size * 0.4,
                    boxShadow: ring
                        ? "0 0 0 4px rgba(255,255,255,.10), 0 16px 40px -12px rgba(108,82,255,.6)"
                        : "none",
                }}
            >
                {photo ? (
                    <img
                        src={photo}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    initials
                )}
            </div>
        </div>
    );
}

// ---- Live clock ----
export function useClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

// ---- Starfield ----
export function Starfield() {
    const stars = useMemo(
        () =>
            Array.from({ length: 70 }).map(() => ({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                r: Math.random() * 2 + 0.6,
                d: Math.random() * 4,
                o: Math.random() * 0.6 + 0.2,
            })),
        [],
    );
    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            width="1920"
            height="1080"
        >
            {stars.map((s, i) => (
                <circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill="#fff"
                    style={{
                        opacity: s.o,
                        animation: `twinkle ${3 + s.d}s ease-in-out ${s.d}s infinite`,
                    }}
                />
            ))}
        </svg>
    );
}

// ---- Ambient backdrop ----
export function Backdrop() {
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                background:
                    "radial-gradient(125% 95% at 100% 0%, #1c1038 0%, #0c0719 46%, #060410 100%)",
            }}
        >
            <div
                className="absolute rounded-full"
                style={{
                    filter: "blur(120px)",
                    width: 1150,
                    height: 950,
                    right: -320,
                    top: -380,
                    background: "rgba(124,70,255,.34)",
                }}
            />
            <div
                className="absolute rounded-full"
                style={{
                    filter: "blur(120px)",
                    width: 820,
                    height: 820,
                    right: -220,
                    bottom: -380,
                    background: "rgba(255,68,144,.16)",
                }}
            />
            <div
                className="absolute rounded-full"
                style={{
                    filter: "blur(120px)",
                    width: 700,
                    height: 700,
                    left: -280,
                    bottom: -320,
                    background: "rgba(108,82,255,.14)",
                }}
            />
        </div>
    );
}

// ---- Top bar ----
interface TopBarProps {
    weather?: string;
}

export function TopBar({ weather }: TopBarProps) {
    const now = useClock();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const date = now.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    return (
        <header className="relative flex items-center justify-between px-14 h-[104px] shrink-0">
            <img
                src="/images/MoonlyLogo_Wit.svg"
                alt="Moonly"
                className="h-6"
            />
            <div className="flex items-baseline gap-4 text-white font-poster">
                <span className="text-white/70 text-[34px] font-medium">
                    {weather || ""}
                </span>
                {weather && (
                    <span className="text-white/30 text-[34px]">·</span>
                )}
                <span className="text-white text-[34px] font-medium">
                    {date}
                </span>
                <span className="ml-3 text-white text-[34px] font-semibold tabular-nums">
                    {hh}:{mm}
                </span>
            </div>
        </header>
    );
}

type RoomLike = RoomConfig & {
    busy?: boolean;
    subtext?: string;
    until?: string | null;
    free?: boolean | null;
};

function normalizeRoom(
    r: RoomLike,
): RoomConfig & { until: string | null; status?: string } {
    let until = r.until ?? null;
    if (!until && r.sub) {
        const match = String(r.sub).match(/(\d{1,2}:\d{2})/);
        until = match?.[1] ?? null;
    }

    return {
        id: r.id || r.name,
        name: r.name,
        free:
            r.free ??
            (r.status === "occupied"
                ? false
                : r.status === "available"
                  ? true
                  : !(r.busy ?? false)),
        until,
        status: r.status,
        sub: r.sub ?? r.subtext,
    };
}

// ---- Room tile ----
function RoomTile({ r }: { r: RoomConfig }) {
    const room = normalizeRoom(r);
    const unknown =
        room.status === "unknown" ||
        room.free === null ||
        room.free === undefined;
    const free = !unknown && room.free;
    const c = unknown ? "#8b84a8" : free ? "#27DD36" : "#DD2727";
    const label = unknown ? "Geen data" : free ? "Beschikbaar" : "Bezet";
    return (
        <div
            className="relative flex-1 flex items-center overflow-hidden"
            style={{
                height: 56,
                paddingLeft: 28,
                paddingRight: 18,
                gap: 12,
                borderRadius: 16,
                background: "rgba(255,255,255,.035)",
                border: "1px solid rgba(255,255,255,.07)",
            }}
        >
            <span
                className="absolute left-0 top-0 bottom-0"
                style={{ width: 4, background: c, boxShadow: `0 0 16px ${c}` }}
            />
            <span
                className="font-poster font-semibold text-white leading-none whitespace-nowrap"
                style={{ fontSize: 22 }}
            >
                {room.name}
            </span>
            <span className="flex-1" />
            <div
                className="flex items-center whitespace-nowrap"
                style={{ gap: 10 }}
            >
                <span
                    className="rounded-full font-poster font-semibold leading-none"
                    style={{
                        fontSize: 16,
                        padding: "5px 16px",
                        color: c,
                        border: `1.5px solid ${c}`,
                    }}
                >
                    {label}
                </span>
                {!unknown && room.until && (
                    <span
                        className="font-poster font-medium leading-none"
                        style={{ fontSize: 18, color: "rgba(255,255,255,.85)" }}
                    >
                        tot {room.until}
                    </span>
                )}
            </div>
        </div>
    );
}

// ---- App bar (room availability footer) ----
interface AppBarProps {
    rooms?: RoomConfig[];
}

export function AppBar({ rooms }: AppBarProps) {
    if (!rooms || rooms.length === 0) return null;
    return (
        <footer className="relative shrink-0 px-14 pb-5 pt-1">
            <div className="flex" style={{ gap: 14 }}>
                {rooms.map((r) => (
                    <RoomTile key={r.id || r.name} r={r} />
                ))}
            </div>
        </footer>
    );
}

// ---- Stage scale hook ----
export function useStageScale() {
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const fit = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (w <= 0 || h <= 0) return;
            setScale(Math.min(w / 1920, h / 1080));
        };
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, []);
    return scale;
}
