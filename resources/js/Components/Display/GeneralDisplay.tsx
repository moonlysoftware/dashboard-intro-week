import { useState, useEffect } from "react";
import { Backdrop, TopBar, AppBar, Avatar } from "@/Components/Display/Shell";
import { getUpcomingBirthdays } from "@/lib/birthdays";
import type { ScreenConfig } from "@/types";

interface BlockWidget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    data?: any;
}

interface GeneralDisplayProps {
    widgets: BlockWidget[];
    screenConfig?: ScreenConfig;
}

function Block({
    children,
    className = "",
    style,
}: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`bento rounded-[34px] overflow-hidden relative ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}

function BlockHead({
    title,
    sub,
    accent,
}: {
    title: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="flex items-center gap-4 mb-4">
            <div className="min-w-0">
                <div className="font-display font-bold text-white text-[22px] leading-none">
                    {title}
                </div>
                {sub && (
                    <div className="text-white/45 text-[15px] font-semibold mt-1 truncate">
                        {sub}
                    </div>
                )}
            </div>
            {accent && (
                <span
                    className="ml-auto h-3 w-3 rounded-full shrink-0"
                    style={{
                        background: accent,
                        boxShadow: `0 0 16px ${accent}`,
                    }}
                />
            )}
        </div>
    );
}

// ---- Agenda block ----
function MiniEventCard({ ev }: { ev: any }) {
    const title = ev.title || ev.name || "";
    const when = ev.when_label || ev.when || "";
    const tag = ev.tag || ev.where || ev.location || "";
    const grad =
        ev.grad ||
        (ev.accent
            ? `linear-gradient(150deg,${ev.accent}cc,${ev.accent}55)`
            : "linear-gradient(150deg,#6C52FF,#FF4490)");

    return (
        <div
            className="relative rounded-[24px] overflow-hidden min-h-0"
            style={{ background: ev.photo ? "#0c0a18" : grad }}
        >
            {ev.photo && (
                <img
                    src={ev.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: ev.pos || "center" }}
                />
            )}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(180deg,rgba(6,4,16,.08) 0%,rgba(6,4,16,.55) 60%,rgba(6,4,16,.92) 100%)",
                }}
            />
            <div className="relative h-full flex flex-col justify-end p-5">
                {tag && (
                    <span className="self-start text-[16px] font-bold bg-white/15 backdrop-blur-sm text-white rounded-full px-3 py-1 mb-2 truncate max-w-full leading-none">
                        {tag}
                    </span>
                )}
                <h3 className="font-display font-bold text-white text-[24px] leading-tight truncate">
                    {title}
                </h3>
                <div className="text-white/55 text-[18px] font-semibold mt-1 truncate">
                    {when}
                </div>
            </div>
        </div>
    );
}

function AgendaBlock({ data }: { data: any }) {
    const events = (Array.isArray(data?.data) ? data.data : []) as any[];
    const title = data?.config?.title || "Agenda";
    const subtitle = data?.config?.subtitle || "Aankomende evenementen";

    return (
        <Block className="h-full p-8 flex flex-col">
            <BlockHead title={title} sub={subtitle} accent="#6C52FF" />
            <div
                className="flex-1 min-h-0 grid gap-4"
                style={{
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gridTemplateRows: "repeat(3, 1fr)",
                }}
            >
                {events.length === 0 && (
                    <div className="col-span-2 flex items-center justify-center text-white/20 text-[22px] font-medium">
                        Geen evenementen gepland
                    </div>
                )}
                {events.slice(0, 6).map((ev, i) => (
                    <MiniEventCard key={i} ev={ev} />
                ))}
            </div>
        </Block>
    );
}

// ---- Compact birthdays ----
function BirthdayMini({ b }: { b: any }) {
    return (
        <div
            className="flex items-center gap-5 rounded-[22px] px-5 py-4 flex-1 min-h-0"
            style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
            }}
        >
            <Avatar name={b.name} photo={b.photo} size={80} ring={false} />
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white text-[22px] leading-none truncate">
                    {b.name}
                </div>
                <div className="text-white/55 text-[16px] font-semibold mt-1.5 whitespace-nowrap">
                    🎂 {b.turns || b.age}
                </div>
            </div>
            <div className="text-right shrink-0">
                {b.soon && (
                    <div className="font-extrabold text-[#FF4490] text-[13px] uppercase tracking-wide whitespace-nowrap mb-1">
                        {b.soon}
                    </div>
                )}
                <div className="text-white/75 text-[18px] font-bold whitespace-nowrap">
                    {b.date}
                </div>
            </div>
        </div>
    );
}

function BirthdaysBlock({ data }: { data: any }) {
    const configList = data?.config?.list ?? [];
    const list = (
        configList.length ? configList : getUpcomingBirthdays(3)
    ).slice(0, 3);
    return (
        <Block className="h-full p-8 flex flex-col">
            <BlockHead
                title="Komende verjaardagen"
                sub="De eerstvolgende 3"
                accent="#FFC53D"
            />
            <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
                {list.map((b: any, i: number) => (
                    <BirthdayMini key={i} b={b} />
                ))}
            </div>
        </Block>
    );
}

// ---- Announcements mini-block ----
const ANN_SPLIT_BLEND =
    "linear-gradient(90deg, #08060f 0%, #08060f 6%, rgba(8,6,15,.8) 18%, rgba(8,6,15,.4) 34%, rgba(8,6,15,.1) 50%, transparent 64%)";

const ANN_OVERLAY_BLEND =
    "linear-gradient(180deg, rgba(8,6,15,.05) 0%, rgba(8,6,15,.55) 55%, rgba(8,6,15,.95) 100%)";

function AnnMiniSplit({ ann }: { ann: any }) {
    const body = typeof ann.body === "string" ? ann.body.split(/\n{2,}/)[0] : "";
    return (
        <div className="h-full flex overflow-hidden" style={{ background: "#08060f" }}>
            <div className="relative z-10 flex h-full w-[42%] shrink-0 flex-col justify-center px-8 py-7 gap-3">
                {ann.badge && (
                    <span className="self-start text-[15px] font-bold bg-white/15 backdrop-blur-sm text-white rounded-full px-4 py-1.5 leading-none">
                        {ann.badge}
                    </span>
                )}
                {ann.title && (
                    <h3 className="font-display font-bold text-white text-[28px] leading-tight">
                        {ann.title}
                    </h3>
                )}
                {body && (
                    <p className="text-white/55 text-[17px] font-semibold leading-snug line-clamp-3">
                        {body}
                    </p>
                )}
            </div>
            <div className="relative h-full w-[58%]">
                {ann.photo ? (
                    <img
                        src={ann.photo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: ann.pos || "center" }}
                    />
                ) : (
                    <div className="absolute inset-0 imgslot opacity-60" />
                )}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: ANN_SPLIT_BLEND }}
                />
            </div>
        </div>
    );
}

function AnnMiniOverlay({ ann }: { ann: any }) {
    const body = typeof ann.body === "string" ? ann.body.split(/\n{2,}/)[0] : "";
    return (
        <div className="h-full relative overflow-hidden">
            {ann.photo ? (
                <img
                    src={ann.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: ann.pos || "center" }}
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(150deg,#6C52FF,#FF4490)" }}
                />
            )}
            <div
                className="absolute inset-0"
                style={{ background: ANN_OVERLAY_BLEND }}
            />
            <div className="relative h-full flex flex-col justify-end px-8 py-7 gap-2">
                {ann.badge && (
                    <span className="self-start text-[15px] font-bold bg-white/15 backdrop-blur-sm text-white rounded-full px-4 py-1.5 leading-none">
                        {ann.badge}
                    </span>
                )}
                {ann.title && (
                    <h3 className="font-display font-bold text-white text-[28px] leading-tight">
                        {ann.title}
                    </h3>
                )}
                {body && (
                    <p className="text-white/55 text-[17px] font-semibold leading-snug line-clamp-2">
                        {body}
                    </p>
                )}
            </div>
        </div>
    );
}

function AnnouncementsBlock({ data }: { data: any }) {
    const slides = (data?.data?.slides ?? []) as any[];
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const current = slides[idx] ?? null;

    if (slides.length === 0) {
        return (
            <Block className="h-full p-8 flex flex-col">
                <BlockHead title="Mededelingen" accent="#FF4490" />
                <div className="flex-1 flex items-center justify-center text-white/20 text-[20px] font-semibold">
                    Geen mededelingen
                </div>
            </Block>
        );
    }

    return (
        <Block className="h-full relative">
            {current?.style === "overlay" ? (
                <AnnMiniOverlay ann={current} />
            ) : (
                <AnnMiniSplit ann={current} />
            )}
            {slides.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                                width: i === idx ? 22 : 6,
                                background: i === idx ? "#FF4490" : "rgba(255,255,255,.25)",
                            }}
                        />
                    ))}
                </div>
            )}
        </Block>
    );
}

export default function GeneralDisplay({
    widgets,
    screenConfig,
}: GeneralDisplayProps) {
    const rooms = screenConfig?.rooms ?? [];
    const weather = screenConfig?.weather;

    const agenda = widgets.find((w) => w.widget_type === "agenda");
    const birthday = widgets.find(
        (w) => w.widget_type === "birthday" || w.widget_type === "birthdays",
    );
    const announcements = widgets.find((w) => w.widget_type === "announcements");

    return (
        <div className="absolute inset-0 flex flex-col text-white">
            <Backdrop />
            <div className="relative z-10 flex flex-col h-full">
                <TopBar weather={weather} />

                <main className="flex-1 min-h-0 px-12 pt-2 pb-3">
                    <div
                        className="h-full grid gap-7"
                        style={{
                            gridTemplateColumns: "1.04fr 0.96fr",
                            gridTemplateRows: "1fr 1fr",
                        }}
                    >
                        {/* Agenda spans both rows on the left */}
                        <div className="row-span-2 h-full min-h-0">
                            <AgendaBlock data={agenda || {}} />
                        </div>
                        {/* Top-right: birthdays */}
                        <div className="h-full min-h-0">
                            <BirthdaysBlock data={birthday || {}} />
                        </div>
                        {/* Bottom-right: announcements */}
                        <div className="h-full min-h-0">
                            <AnnouncementsBlock data={announcements || {}} />
                        </div>
                    </div>
                </main>

                <AppBar rooms={rooms} />
            </div>
        </div>
    );
}
