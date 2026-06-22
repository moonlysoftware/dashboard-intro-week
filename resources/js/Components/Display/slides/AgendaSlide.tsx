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
                <span
                    className="grad-pill self-start rounded-full text-white font-poster font-bold mb-5"
                    style={{
                        padding: big ? "11px 28px" : "8px 22px",
                        fontSize: big ? 33 : 26,
                        boxShadow: "0 12px 36px -12px rgba(178,61,240,.6)",
                    }}
                >
                    {ev.tag}
                </span>
                <h2
                    className={`font-poster font-bold text-white leading-[1.0] mb-3 ann-shadow ${big ? "text-[78px]" : "text-[56px]"}`}
                >
                    {ev.name}
                </h2>
                <div
                    className={`font-poster font-semibold text-white ann-shadow ${big ? "text-[42px] mb-4" : "text-[33px] mb-3"}`}
                >
                    {variant === "row" ? ev.when : `Datum: ${ev.when}`}
                </div>
                <p
                    className={`text-white/80 font-manrope font-medium leading-snug ann-shadow ${big ? "text-[31px] max-w-[600px]" : "text-[27px]"}`}
                >
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
