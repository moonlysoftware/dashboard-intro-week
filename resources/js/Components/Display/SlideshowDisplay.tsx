import { useEffect, useRef, useState } from 'react';
import { Backdrop, TopBar, AppBar } from '@/Components/Display/Shell';
import AgendaSlide from '@/Components/Display/slides/AgendaSlide';
import BirthdaysSlide from '@/Components/Display/slides/BirthdaysSlide';
import AppreciationSlide from '@/Components/Display/slides/AppreciationSlide';
import AnnouncementSlide from '@/Components/Display/slides/AnnouncementSlide';
import type { RoomConfig, ScreenConfig } from '@/types';

interface SlideWidget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_order: number;
    data?: any;
}

interface SlideshowDisplayProps {
    widgets: SlideWidget[];
    screenConfig?: ScreenConfig;
}

const SLIDE_TYPES = new Set([
    'agenda',
    'birthdays',
    'birthday',
    'appreciation',
    'announcement',
    'announcements',
]);

function renderSlide(widget: SlideWidget) {
    const content = widget.config || {};
    switch (widget.widget_type) {
        case 'agenda':
            return <AgendaSlide content={content} events={widget.data} />;
        case 'birthdays':
        case 'birthday':
            return <BirthdaysSlide content={content} />;
        case 'appreciation':
            return <AppreciationSlide content={content} />;
        case 'announcement':
        case 'announcements':
            return <AnnouncementSlide content={content} />;
        default:
            return null;
    }
}

export default function SlideshowDisplay({ widgets, screenConfig }: SlideshowDisplayProps) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const slides = [...widgets]
        .filter((w) => SLIDE_TYPES.has(w.widget_type))
        .filter((w) => w.config?._enabled !== false)
        .filter((w) => {
            const until = w.config?._availableUntil;
            return !until || todayStr <= until;
        })
        .sort((a, b) => a.grid_order - b.grid_order);
    const cycleMs = Math.max(10, (screenConfig?.cycleSeconds ?? 60)) * 1000;
    const rooms = screenConfig?.rooms ?? [];
    const weather = screenConfig?.weather;

    const [idx, setIdx] = useState(0);
    const [paused] = useState(false);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const go = (n: number) => setIdx(slides.length ? (n + slides.length) % slides.length : 0);

    const restart = () => {
        if (timer.current) clearInterval(timer.current);
        if (paused || slides.length <= 1) return;
        timer.current = setInterval(() => setIdx((i) => (i + 1) % slides.length), cycleMs);
    };

    useEffect(() => {
        restart();
        return () => { if (timer.current) clearInterval(timer.current); };
    }, [paused, cycleMs, slides.length]);

    useEffect(() => {
        if (idx >= slides.length) setIdx(0);
    }, [slides.length]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') { go(idx + 1); restart(); }
            if (e.key === 'ArrowLeft') { go(idx - 1); restart(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [idx, slides.length]);

    const jump = (n: number) => { go(n); restart(); };

    return (
        <div className="absolute inset-0 flex flex-col text-white">
            <Backdrop />
            <div className="relative z-10 flex flex-col h-full">
                <TopBar weather={weather} />

                <main
                    className="relative flex-1 min-h-0 mx-12 mt-1 mb-3 rounded-[36px] overflow-hidden"
                    style={{ background: 'rgba(255,255,255,.018)', border: '1px solid rgba(255,255,255,.06)' }}
                >
                    {slides.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-20">
                            <div className="text-[120px] mb-6">🌙</div>
                            <h2 className="font-display font-bold text-white text-[64px] mb-4">Geen slides geconfigureerd</h2>
                            <p className="text-white/60 text-[34px] font-medium">Voeg slides toe in de beheeromgeving.</p>
                        </div>
                    )}

                    {slides.map((s, i) => (
                        <div key={s.id} className={`moonly-slide${i === idx ? ' is-active' : ''}`}>
                            {renderSlide(s)}
                        </div>
                    ))}

                    {/* Progress bar */}
                    {slides.length > 1 && !paused && (
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/8 z-20">
                            <div
                                key={`${idx}|${cycleMs}`}
                                className="h-full"
                                style={{
                                    background: 'linear-gradient(90deg,#05BFDB,#6C52FF,#FF4490)',
                                    animation: `growbar ${cycleMs}ms linear forwards`,
                                }}
                            />
                        </div>
                    )}

                    {/* Dot navigation */}
                    {slides.length > 1 && (
                        <div
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full"
                            style={{ background: 'rgba(5,2,21,.5)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(8px)' }}
                        >
                            {slides.map((s, i) => (
                                <button
                                    key={s.id}
                                    onClick={() => jump(i)}
                                    aria-label={`Ga naar slide ${i + 1}`}
                                    className="transition-all duration-300 rounded-full cursor-pointer border-0"
                                    style={{
                                        width: i === idx ? 36 : 10,
                                        height: 10,
                                        background: i === idx
                                            ? 'linear-gradient(90deg,#6C52FF,#FF4490)'
                                            : 'rgba(255,255,255,.28)',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </main>

                <AppBar rooms={rooms} />
            </div>
        </div>
    );
}
