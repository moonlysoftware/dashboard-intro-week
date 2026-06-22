import { Avatar } from '@/Components/Display/Shell';

interface ReviewItem {
    kind: 'review';
    name: string;
    role: string;
    quote: string;
}

interface ChatItem {
    kind: 'chat';
    name: string;
    time: string;
    msgs: string[];
}

type AppreciationItem = ReviewItem | ChatItem;

interface AppreciationContent {
    layout?: 'grid' | 'spotlight' | 'list';
    items?: AppreciationItem[];
}

const FALLBACK: AppreciationItem[] = [
    { kind: 'review', name: 'Mark Hofman', role: 'CEO · Vexa Retail', quote: 'Het Moonly-team bouwde ons platform in recordtijd opnieuw op. De beste partner.' },
    { kind: 'chat', name: 'Tom Verbeek', time: '14:08', msgs: ['Jullie hebben onze launch gered 🙌', 'Volgende keer koffie van ons ☕'] },
    { kind: 'chat', name: 'Imani Brown', time: '17:25', msgs: ['Cijfers zijn 38% omhoog deze maand 📈', 'Bedankt Moonly! ❤️'] },
    { kind: 'review', name: 'Kevin Pos', role: 'CTO · Northdock', quote: 'Ze maakten van een rommelig idee een product waar onze gebruikers dol op zijn.' },
];

function Stars({ n = 5, size = 20 }: { n?: number; size?: number }) {
    return (
        <div className="flex gap-[3px]">
            {Array.from({ length: n }).map((_, i) => (
                <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#FFC53D">
                    <path d="M12 2l2.9 6.3 6.8.8-5 4.7 1.3 6.8L12 17.8 5.9 20.6 7.3 13.8l-5-4.7 6.8-.8z" />
                </svg>
            ))}
        </div>
    );
}

function ChatCard({ item, big = false }: { item: ChatItem; big?: boolean }) {
    return (
        <div
            className="rounded-[30px] p-8 h-full flex flex-col overflow-hidden"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', minHeight: 0 }}
        >
            <div className="flex items-center gap-4 mb-4">
                <Avatar name={item.name} size={big ? 64 : 52} ring={false} />
                <div className="min-w-0">
                    <div className="slide-title truncate">{item.name}</div>
                    <div className="slide-body text-[#27DD36] flex items-center gap-2 mt-2">
                        <span className="h-2 w-2 rounded-full bg-[#27DD36]" />online
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 justify-center">
                {item.msgs.map((m, i) => (
                    <div
                        key={i}
                        className="slide-body self-start max-w-[90%] rounded-[20px] rounded-tl-md text-white px-6 py-3"
                        style={{ background: 'linear-gradient(135deg,#1f7a44,#27a85a)' }}
                    >
                        {m}
                    </div>
                ))}
            </div>
            <div className="slide-body-muted text-right mt-2">{item.time} · ✓✓</div>
        </div>
    );
}

function ReviewCard({ item, big = false }: { item: ReviewItem; big?: boolean }) {
    return (
        <div
            className="rounded-[30px] bg-white p-8 h-full flex flex-col overflow-hidden"
            style={{ boxShadow: '0 30px 70px -25px rgba(0,0,0,.55)', minHeight: 0 }}
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4 min-w-0">
                    <Avatar name={item.name} size={big ? 68 : 56} ring={false} />
                    <div className="min-w-0">
                        <div className="slide-title text-[#050215] truncate">{item.name}</div>
                        <div className="slide-body-muted text-[#050215]/50 mt-2 truncate">{item.role}</div>
                    </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                    <Stars size={20} />
                    <div className="slide-body text-[#050215]/40 mt-1">via Google</div>
                </div>
            </div>
            <p className="slide-body text-[#050215]/85 flex-1">
                "{item.quote}"
            </p>
        </div>
    );
}

function AppreciationCard({ item, big = false }: { item: AppreciationItem; big?: boolean }) {
    return item.kind === 'chat'
        ? <ChatCard item={item} big={big} />
        : <ReviewCard item={item} big={big} />;
}

function AppreciationRow({ item }: { item: AppreciationItem }) {
    const isReview = item.kind !== 'chat';
    return (
        <div
            className="flex items-center gap-7 rounded-[26px] px-9 flex-1 overflow-hidden"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}
        >
            <Avatar name={item.name} size={80} ring={false} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                    <span className="slide-title truncate">{item.name}</span>
                    {isReview && item.kind === 'review'
                        ? <span className="slide-body-muted truncate">· {item.role}</span>
                        : <span className="slide-body text-[#27DD36] flex items-center gap-2 whitespace-nowrap">
                            <span className="h-2 w-2 rounded-full bg-[#27DD36]" />online
                          </span>}
                </div>
                <p className="slide-body text-white/75 truncate">
                    {isReview && item.kind === 'review'
                        ? `"${item.quote}"`
                        : item.kind === 'chat' ? item.msgs.join('   ·   ') : ''}
                </p>
            </div>
            {isReview
                ? <div className="shrink-0"><Stars size={20} /></div>
                : item.kind === 'chat' && <div className="shrink-0 slide-body-muted whitespace-nowrap">{item.time}</div>}
        </div>
    );
}

export default function AppreciationSlide({ content }: { content?: AppreciationContent }) {
    const items = (content?.items?.length ? content.items : FALLBACK).slice(0, 4);
    const layout = content?.layout || 'grid';

    let body;
    if (layout === 'spotlight') {
        const [first, ...rest] = items;
        body = (
            <div className="h-full grid gap-8" style={{ gridTemplateColumns: '1.25fr 0.75fr' }}>
                <div className="min-h-0"><AppreciationCard item={first} big /></div>
                <div className="flex flex-col gap-7 min-h-0">
                    {rest.slice(0, 3).map((it, i) => (
                        <div key={i} className="min-h-0 flex-1"><AppreciationCard item={it} /></div>
                    ))}
                </div>
            </div>
        );
    } else if (layout === 'list') {
        body = (
            <div className="h-full flex flex-col gap-5">
                {items.map((it, i) => <AppreciationRow key={i} item={it} />)}
            </div>
        );
    } else {
        body = (
            <div className="h-full grid gap-8" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
                {items.map((it, i) => (
                    <div key={i} className="min-h-0"><AppreciationCard item={it} /></div>
                ))}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col px-16 pt-10 pb-[82px]">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <span className="h-[14px] w-[14px] rounded-full" style={{ background: '#05BFDB', boxShadow: '0 0 22px #05BFDB' }} />
                        <span className="slide-label uppercase tracking-[.34em] text-[#B5A9FF]/80 whitespace-nowrap">
                            Jullie maken het de moeite waard
                        </span>
                    </div>
                    <h1 className="slide-title whitespace-nowrap">Klantwaardering</h1>
                </div>
                <div className="text-right">
                    <div className="slide-body-muted">Rechtstreeks uit de inbox</div>
                    <div className="grad-text slide-label">★ 4,9 gem. score</div>
                </div>
            </div>
            <div className="flex-1 min-h-0">{body}</div>
        </div>
    );
}
