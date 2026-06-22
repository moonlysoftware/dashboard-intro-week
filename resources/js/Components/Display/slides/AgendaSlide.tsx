import React from "react";
import { SlideLayout } from "@/Components/Display/SlideLayout";

interface AgendaEvent {
    name?: string;
    title?: string;
    emoji?: string;
    when: string;
    tag?: string;
    where?: string;
    tagline?: string;
    grad?: string;
    accent?: string;
    photo?: string;
    pos?: string;
}

interface AgendaContent {
    layout?: "featured" | "grid" | "list";
    events?: AgendaEvent[];
}

const DEFAULT_EVENTS: AgendaEvent[] = [
    {
        name: "Ibiza-trip",
        emoji: "🏝️",
        when: "06 okt – 10 okt",
        tag: "Bedrijfsuitje",
        tagline:
            "Vier dagen zon, zee en het hele team! Tassen gepakt - we vliegen!",
        grad: "linear-gradient(150deg,#FF73AC 0%,#6C52FF 55%,#05BFDB 120%)",
    },
    {
        name: "Casino Edition",
        emoji: "🎲",
        when: "30 oktober",
        tag: "Boardgame Night",
        tagline:
            "Na de vorige succesvolle boardgame-avond is het tijd voor een nieuwe editie.",
        grad: "linear-gradient(140deg,#826dff,#d73fe8)",
    },
    {
        name: "IJM Live",
        emoji: "🎤",
        when: "vrijdag 25 sept",
        tag: "Festival",
        tagline:
            "Voor iedereen die zich heeft aangemeld: het IJM Festival komt er bijna aan!",
        grad: "linear-gradient(140deg,#2ac9e0,#6C52FF)",
    },
];

function normalizeEvent(
    e: AgendaEvent,
): Required<Pick<AgendaEvent, "name" | "when" | "tag" | "tagline">> &
    AgendaEvent {
    const accent = e.accent || "#6C52FF";
    return {
        ...e,
        name: e.name || e.title || "",
        tag: e.tag || e.where || "",
        tagline: e.tagline || "",
        grad:
            e.grad ||
            (e.accent
                ? `linear-gradient(140deg, ${accent}, ${accent})`
                : undefined),
    };
}

function AgendaCard({
    e,
    variant = "row",
}: {
    e: AgendaEvent;
    variant?: "big" | "row" | "col";
}) {
    const ev = normalizeEvent(e);
    const bottom = variant !== "row";
    const big = variant === "big";
    const scrim = bottom
        ? "linear-gradient(180deg, rgba(6,4,16,.05) 0%, rgba(6,4,16,.10) 32%, rgba(6,4,16,.60) 66%, rgba(6,4,16,.95) 100%)"
        : "linear-gradient(90deg, rgba(6,4,16,.96) 0%, rgba(6,4,16,.82) 38%, rgba(6,4,16,.32) 74%, rgba(6,4,16,.10) 100%)";

    return (
        <div
            className={`relative rounded-[30px] overflow-hidden ${variant === "col" ? "h-full" : "flex-1"}`}
            style={{
                background: ev.photo ? "#0c0a18" : ev.grad || "#6C52FF",
            }}
        >
            {ev.photo && (
                <img
                    src={ev.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: ev.pos || "center" }}
                />
            )}
            <div className="absolute inset-0" style={{ background: scrim }} />
            <div
                className={`relative h-full flex flex-col ${bottom ? "justify-end" : "justify-center"} ${big ? "p-12" : "p-9"}`}
                style={variant === "row" ? { maxWidth: "64%" } : undefined}
            >
                <span className="slide-pill self-start mb-5">
                    {ev.tag}
                </span>
                <h2 className="slide-title mb-3 ann-shadow">
                    {ev.name}
                </h2>
                <div className="slide-date ann-shadow mb-3">
                    {variant === "row" ? ev.when : (
                        <>
                            <span className="font-bold">Datum: </span>
                            {ev.when}
                        </>
                    )}
                </div>
                <p className="slide-body text-white/80 ann-shadow max-w-[600px]">
                    {ev.tagline}
                </p>
            </div>
        </div>
    );
}

export default function AgendaSlide({ content }: { content?: AgendaContent }) {
    const events = content?.events?.length ? content.events : DEFAULT_EVENTS;
    const layout = content?.layout || "featured";
    const [a, b, c] = events;

    let body: React.ReactNode;
    if (layout === "grid") {
        body = (
            <div
                className="h-full grid gap-7"
                style={{
                    gridTemplateColumns: `repeat(${Math.min(events.length, 3)}, minmax(0,1fr))`,
                }}
            >
                {events.slice(0, 3).map((e, i) => (
                    <AgendaCard key={i} e={e} variant="col" />
                ))}
            </div>
        );
    } else if (layout === "list") {
        body = (
            <div className="h-full flex flex-col gap-7">
                {events.slice(0, 3).map((e, i) => (
                    <AgendaCard key={i} e={e} variant="row" />
                ))}
            </div>
        );
    } else {
        body = (
            <div className="h-full grid grid-cols-[1fr_1fr] gap-7">
                {a && <AgendaCard e={a} variant="big" />}
                <div className="flex flex-col gap-7 min-h-0">
                    {b && <AgendaCard e={b} variant="row" />}
                    {c && <AgendaCard e={c} variant="row" />}
                </div>
            </div>
        );
    }

    return (
        <SlideLayout title="Agenda">
            {body}
        </SlideLayout>
    );
}
