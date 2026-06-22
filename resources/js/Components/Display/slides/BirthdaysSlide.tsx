import { useMemo } from "react";
import { Avatar } from "@/Components/Display/Shell";
import { SlideLayout } from "@/Components/Display/SlideLayout";
import birthdaysData from "../../../data/birthdays.json";

interface BirthdayPerson {
    name: string;
    date: string;
    turns: string;
    soon: string;
    photo?: string;
}

interface BirthdaysContent {
    layout?: "featured" | "grid";
    list?: BirthdayPerson[];
}

function getNextBirthday(birthdate: string): Date {
    const [, month, day] = birthdate.split("-").map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = new Date(today.getFullYear(), month - 1, day);
    if (thisYear >= today) return thisYear;
    return new Date(today.getFullYear() + 1, month - 1, day);
}

function daysUntil(birthdate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = getNextBirthday(birthdate);
    return Math.round(
        (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
}

function getAgeThisBirthday(birthdate: string): number {
    const [birthYear] = birthdate.split("-").map(Number);
    const next = getNextBirthday(birthdate);
    return next.getFullYear() - birthYear;
}

function formatDate(birthdate: string): string {
    const [, month, day] = birthdate.split("-").map(Number);
    const date = new Date(2000, month - 1, day);
    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}

function BdayFeatured({ p }: { p: BirthdayPerson }) {
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
                        background:
                            "radial-gradient(circle, rgba(124,70,255,.40), transparent 70%)",
                    }}
                />
                <Avatar name={p.name} photo={p.photo} size={300} />
            </div>
            <span
                className="grad-pill rounded-full px-9 py-3 text-white font-poster font-bold text-[34px] mt-9 mb-5"
                style={{ boxShadow: "0 14px 42px -12px rgba(178,61,240,.6)" }}
            >
                {p.soon}
            </span>
            <h2 className="font-poster font-bold text-white text-[76px] leading-none mb-4">
                {p.name}
            </h2>
            <div className="font-poster font-bold text-white text-[44px] leading-none mb-2">
                {p.date}
            </div>
            <div className="text-white/55 font-manrope text-[30px] font-medium">
                {p.turns}
            </div>
        </div>
    );
}

function BdayRow({ p }: { p: BirthdayPerson }) {
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
                <h3 className="font-poster font-bold text-white text-[46px] leading-none mb-2 truncate">
                    {p.name}
                </h3>
                <div className="text-white/55 font-manrope text-[28px] font-medium">
                    {p.turns}
                </div>
            </div>
            <div className="text-right shrink-0">
                <div className="text-[#FF4490] font-poster font-semibold text-[31px] leading-none mb-2 whitespace-nowrap">
                    {p.soon}
                </div>
                <div className="text-white font-poster font-bold text-[36px] whitespace-nowrap">
                    {p.date}
                </div>
            </div>
        </div>
    );
}

function BdayCard({ p }: { p: BirthdayPerson }) {
    return (
        <div
            className="flex flex-col items-center text-center justify-center gap-3.5 rounded-[28px] p-7 h-full"
            style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)",
            }}
        >
            <Avatar name={p.name} photo={p.photo} size={150} />
            <span className="grad-pill rounded-full px-6 py-2 text-white font-poster font-bold text-[24px]">
                {p.soon}
            </span>
            <h3 className="font-poster font-bold text-white text-[42px] leading-tight">
                {p.name}
            </h3>
            <div className="font-poster font-bold text-white text-[34px] leading-none">
                {p.date}
            </div>
            <div className="text-white/55 font-manrope text-[26px]">
                {p.turns}
            </div>
        </div>
    );
}

export default function BirthdaysSlide({
    content,
}: {
    content?: BirthdaysContent;
}) {
    const computedList = useMemo(() => {
        return birthdaysData
            .map((p) => ({
                ...p,
                days: daysUntil(p.birthdate),
            }))
            .sort((a, b) => a.days - b.days)
            .map((p) => {
                let soon = `Over ${p.days} dagen`;
                if (p.days === 0) soon = "Vandaag";
                else if (p.days === 1) soon = "Morgen";

                return {
                    name: p.name,
                    date: formatDate(p.birthdate),
                    turns: `Wordt ${getAgeThisBirthday(p.birthdate)}`,
                    soon,
                    photo: p.image
                        ? `/storage/birthdays/${p.image}`
                        : undefined,
                };
            });
    }, []);

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

    return (
        <SlideLayout title="Verjaardagen">
            {body}
        </SlideLayout>
    );
}
