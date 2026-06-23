import { Backdrop, TopBar, AppBar, Avatar } from '@/Components/Display/Shell';
import { getUpcomingBirthdays } from '@/lib/birthdays';
import type { ScreenConfig } from '@/types';

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

function Block({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={`bento rounded-[34px] overflow-hidden relative ${className}`} style={style}>{children}</div>;
}

function BlockHead({ icon, title, sub, accent }: { icon: string; title: string; sub?: string; accent?: string }) {
    return (
        <div className="flex items-center gap-4 mb-5">
            <div className="h-[58px] w-[58px] rounded-2xl flex items-center justify-center text-[32px] shrink-0"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="font-display font-bold text-white text-[40px] leading-none truncate">{title}</div>
                {sub && <div className="text-white/45 text-[24px] font-semibold mt-1.5 truncate">{sub}</div>}
            </div>
            {accent && (
                <span className="ml-auto h-3.5 w-3.5 rounded-full shrink-0"
                    style={{ background: accent, boxShadow: `0 0 22px ${accent}` }} />
            )}
        </div>
    );
}

// ---- Agenda block ----
function MiniEventCard({ ev }: { ev: any }) {
    const title = ev.title || ev.name || '';
    const when = ev.when_label || ev.when || '';
    const tag = ev.tag || ev.where || ev.location || '';
    const grad = ev.grad || (ev.accent
        ? `linear-gradient(150deg,${ev.accent}cc,${ev.accent}55)`
        : 'linear-gradient(150deg,#6C52FF,#FF4490)');

    return (
        <div
            className="relative rounded-[24px] overflow-hidden min-h-0"
            style={{ background: ev.photo ? '#0c0a18' : grad }}
        >
            {ev.photo && (
                <img
                    src={ev.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: ev.pos || 'center' }}
                />
            )}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg,rgba(6,4,16,.08) 0%,rgba(6,4,16,.55) 60%,rgba(6,4,16,.92) 100%)' }}
            />
            <div className="relative h-full flex flex-col justify-end p-5">
                {tag && (
                    <span className="self-start text-[17px] font-bold bg-white/15 backdrop-blur-sm text-white rounded-full px-3 py-1 mb-2 truncate max-w-full leading-none">
                        {tag}
                    </span>
                )}
                <h3 className="font-display font-bold text-white text-[26px] leading-tight truncate">{title}</h3>
                <div className="text-white/55 text-[20px] font-semibold mt-1 truncate">{when}</div>
            </div>
        </div>
    );
}

function AgendaBlock({ data }: { data: any }) {
    const events = (Array.isArray(data?.data) ? data.data : []) as any[];
    const title = data?.config?.title || 'Agenda';
    const subtitle = data?.config?.subtitle || 'Aankomende evenementen';
    const count = Math.min(events.length, 6);
    const cols = count <= 2 ? 1 : 2;
    const rows = count === 0 ? 1 : Math.ceil(count / cols);

    return (
        <Block className="p-10 flex flex-col">
            <BlockHead icon="📅" title={title} sub={subtitle} accent="#6C52FF" />
            <div
                className="flex-1 min-h-0 grid gap-4"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
            >
                {count === 0 && (
                    <div className="flex items-center justify-center text-white/20 text-[28px] font-medium">
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
        <div className="reveal flex items-center gap-5 rounded-[22px] px-5 py-4"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <Avatar name={b.name} size={70} />
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white text-[32px] leading-none truncate">{b.name}</div>
                <div className="text-white/55 text-[23px] font-semibold mt-1.5 whitespace-nowrap">🎂 {b.turns || b.age}</div>
            </div>
            <div className="text-right shrink-0">
                {b.soon && <div className="font-extrabold text-[#FF4490] text-[20px] uppercase tracking-wide whitespace-nowrap">{b.soon}</div>}
                <div className="text-white/75 text-[25px] font-bold whitespace-nowrap">{b.date}</div>
            </div>
        </div>
    );
}

function BirthdaysBlock({ data }: { data: any }) {
    const configList = data?.config?.list ?? [];
    const list = (configList.length ? configList : getUpcomingBirthdays(3)).slice(0, 3);
    return (
        <Block className="p-10 flex flex-col">
            <BlockHead icon="🎂" title="Komende verjaardagen" sub="De eerstvolgende 3" accent="#FFC53D" />
            <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
                {list.map((b: any, i: number) => <BirthdayMini key={i} b={b} />)}
            </div>
        </Block>
    );
}

// ---- Spotlight event ----
function SpotlightBlock({ config }: { config: any }) {
    const s = config || {};
    return (
        <Block style={{ background: s.grad || 'linear-gradient(150deg,#6C52FF,#FF4490)', border: '1px solid rgba(255,255,255,.12)' }}
            className="p-10 flex flex-col justify-between">
            <div className="absolute inset-0 imgslot opacity-50" />
            <div className="absolute -right-12 -top-12 w-[240px] h-[240px] rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(255,255,255,.35),transparent 70%)' }} />
            <div className="relative flex items-start justify-between">
                <span className="inline-flex items-center rounded-full font-bold bg-black/25 backdrop-blur text-white text-[24px] px-6 py-3">
                    {s.badge}
                </span>
                <div className="text-[96px] leading-none drop-shadow-lg">{s.emoji}</div>
            </div>
            <div className="relative">
                <div className="inline-flex items-center gap-3 bg-white/95 text-[#050215] rounded-full px-6 py-2.5 mb-4 font-extrabold text-[26px] whitespace-nowrap">
                    <span className="h-3 w-3 rounded-full bg-[#FF4490]" />{s.when}
                </div>
                <h3 className="font-display font-bold text-white text-[64px] leading-[0.95] mb-3 drop-shadow">{s.title}</h3>
                <p className="text-white/90 text-[28px] leading-snug font-medium">{s.text}</p>
            </div>
        </Block>
    );
}

// ---- Moonly Moment photo ----
function MomentBlock({ config }: { config: any }) {
    const m = config || {};
    return (
        <Block className="p-0">
            {m.photo && <img src={m.photo} alt="" className="kb absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(5,2,21,.05) 30%,rgba(5,2,21,.82) 100%)' }} />
            <div className="relative h-full flex flex-col justify-between p-9">
                <span className="self-start font-poster text-white text-[24px] font-semibold" style={{ letterSpacing: '.3em' }}>
                    {m.title || 'MOONLY MOMENT'}
                </span>
                <p className="font-poster font-semibold text-white text-[34px] leading-tight"
                    style={{ textShadow: '0 3px 18px rgba(0,0,0,.6)' }}>
                    {m.caption}
                </p>
            </div>
        </Block>
    );
}

export default function GeneralDisplay({ widgets, screenConfig }: GeneralDisplayProps) {
    const rooms = screenConfig?.rooms ?? [];
    const weather = screenConfig?.weather;

    const agenda = widgets.find((w) => w.widget_type === 'agenda');
    const birthday = widgets.find((w) => w.widget_type === 'birthday' || w.widget_type === 'birthdays');
    const spotlight = widgets.find((w) => w.widget_type === 'spotlight_event');
    const moment = widgets.find((w) => w.widget_type === 'moment_photo');

    return (
        <div className="absolute inset-0 flex flex-col text-white">
            <Backdrop />
            <div className="relative z-10 flex flex-col h-full">
                <TopBar weather={weather} />

                <main className="flex-1 min-h-0 px-12 pt-2 pb-3">
                    <div className="h-full grid gap-7" style={{ gridTemplateColumns: '1.04fr 0.96fr', gridTemplateRows: '1fr 1fr' }}>
                        {/* Agenda spans both rows on the left */}
                        <div className="row-span-2 min-h-0">
                            <AgendaBlock data={agenda || {}} />
                        </div>
                        {/* Top-right: birthdays */}
                        <div className="min-h-0">
                            <BirthdaysBlock data={birthday || {}} />
                        </div>
                        {/* Bottom-right: spotlight + moment side by side */}
                        <div className="min-h-0 grid gap-7" style={{ gridTemplateColumns: '1.12fr 0.88fr' }}>
                            <SpotlightBlock config={spotlight?.config} />
                            <MomentBlock config={moment?.config} />
                        </div>
                    </div>
                </main>

                <AppBar rooms={rooms} />
            </div>
        </div>
    );
}
