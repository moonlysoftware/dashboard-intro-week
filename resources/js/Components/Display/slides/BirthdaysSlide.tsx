import { useMemo } from "react";
import { Avatar } from "@/Components/Display/Shell";
import { SlideLayout } from "@/Components/Display/SlideLayout";
import { getUpcomingBirthdays, type BirthdayPerson } from "@/lib/birthdays";
import { getUpcomingJubilea, type JubileumPerson } from "@/lib/jubilea";

type MilestonePerson =
    | (BirthdayPerson & { kind?: "birthday"; days?: number })
    | JubileumPerson;

interface BirthdaysContent {
    layout?: "featured" | "grid";
    list?: MilestonePerson[];
}

function getMilestones(): MilestonePerson[] {
    const birthdays = getUpcomingBirthdays(27).map((b) => {
        let days = 0;
        const m = b.soon.match(/Over (\d+) dagen/);
        if (m) days = parseInt(m[1], 10);
        else if (b.soon === "Morgen") days = 1;
        return { ...b, kind: "birthday" as const, days };
    });
    const jubilea = getUpcomingJubilea(22);
    return [...birthdays, ...jubilea].sort(
        (a, b) => (a.days ?? 0) - (b.days ?? 0),
    );
}

function BdayFeatured({ p }: { p: MilestonePerson }) {
    const isJubileum = p.kind === "jubileum";
    return (
        <div
            className="relative rounded-[30px] overflow-hidden h-full flex flex-col items-center justify-center text-center p-10"
            style={{
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.07)",
            }}
        >
            <div className="relative">
                <div
                    className="absolute -inset-7 rounded-full"
                    style={{
                        background: isJubileum
                            ? "radial-gradient(circle, rgba(108,82,255,.40), transparent 70%)"
                            : "radial-gradient(circle, rgba(124,70,255,.40), transparent 70%)",
                    }}
                />
                <Avatar name={p.name} photo={p.photo} size={300} />
            </div>
            <span className="slide-pill mt-9 mb-5 px-9 py-3">{p.soon}</span>
            <h2 className="slide-title mb-4">{p.name}</h2>
            <div className="slide-date mb-2">{p.date}</div>
            <div className="slide-body-muted">{p.turns}</div>
        </div>
    );
}

function BdayRow({ p }: { p: MilestonePerson }) {
    const isJubileum = p.kind === "jubileum";
    return (
        <div
            className="flex items-center gap-8 rounded-[26px] px-9 flex-1 min-h-0"
            style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)",
            }}
        >
            <Avatar name={p.name} photo={p.photo} size={108} ring={false} />
            <div className="flex-1 min-w-0">
                <h3 className="slide-title text-3xl mb-2">{p.name}</h3>
                <div className="slide-body-muted">{p.turns}</div>
            </div>
            <div className="text-right shrink-0">
                <div
                    className={`font-poster font-extralight text-3xl leading-none mb-2 whitespace-nowrap ${isJubileum ? "text-[#6C52FF]" : "text-pink-500"}`}
                >
                    {p.soon}
                </div>
                <div className="slide-date font-light whitespace-nowrap">
                    {p.date}
                </div>
            </div>
        </div>
    );
}

function BdayCard({ p }: { p: MilestonePerson }) {
    const isJubileum = p.kind === "jubileum";
    return (
        <div
            className="flex flex-col items-center text-center justify-center gap-3.5 rounded-[28px] p-7 h-full"
            style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)",
            }}
        >
            <Avatar name={p.name} photo={p.photo} size={150} />
            <span className="slide-pill px-6 py-2">{p.soon}</span>
            <h3 className="slide-title leading-tight">{p.name}</h3>
            <div className="slide-date font-normal leading-none">{p.date}</div>
            <div className="slide-body-muted">{p.turns}</div>
        </div>
    );
}

export default function BirthdaysSlide({
    content,
}: {
    content?: BirthdaysContent;
}) {
    const computedList = useMemo(() => getMilestones(), []);

    const list = content?.list?.length ? content.list : computedList;
    const layout = content?.layout || "featured";
    const [first, ...rest] = list;

    let body;
    if (layout === "grid") {
        body = (
            <div
                className="h-full grid gap-7"
                style={{
                    gridTemplateColumns: `repeat(${Math.min(Math.max(list.length, 1), 4)}, minmax(0,1fr))`,
                }}
            >
                {list.slice(0, 4).map((p, i) => (
                    <BdayCard key={i} p={p} />
                ))}
            </div>
        );
    } else {
        body = (
            <div className="h-full grid grid-cols-[0.92fr_1.08fr] gap-8">
                {first && <BdayFeatured p={first} />}
                <div className="flex flex-col gap-7 min-h-0">
                    {rest.slice(0, 3).map((p, i) => (
                        <BdayRow key={i} p={p} />
                    ))}
                </div>
            </div>
        );
    }

    return <SlideLayout title="Verjaardagen & jubilea">{body}</SlideLayout>;
}
