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

function Stars({ n = 5, size = 26 }: { n?: number; size?: number }) {
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
                <Avatar name={item.name} size={big ? 76 : 58} ring={false} />
                <div className="min-w-0">
                    <div className={`text-white font-bold leading-none truncate ${big ? 'text-[38px]' : 'text-[28px]'}`}>{item.name}</div>
                    <div className={`text-[#27DD36] font-semibold flex items-center gap-2 mt-2 ${big ? 'text-[24px]' : 'text-[19px]'}`}>
                        <span className="h-2 w-2 rounded-full bg-[#27DD36]" />online
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 justify-center">
                {item.msgs.map((m, i) => (
                    <div
                        key={i}
                        className={`self-start max-w-[90%] rounded-[20px] rounded-tl-md text-white font-medium leading-snug ${big ? 'px-8 py-4 text-[34px]' : 'px-6 py-3 text-[26px]'}`}
                        style={{ background: 'linear-gradient(135deg,#1f7a44,#27a85a)' }}
                    >
                        {m}
                    </div>
                ))}
            </div>
            <div className={`text-right text-white/40 font-semibold mt-2 ${big ? 'text-[22px]' : 'text-[18px]'}`}>{item.time} · ✓✓</div>
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
                    <Avatar name={item.name} size={big ? 80 : 62} ring={false} />
                    <div className="min-w-0">
                        <div className={`text-[#050215] font-bold leading-none truncate ${big ? 'text-[38px]' : 'text-[29px]'}`}>{item.name}</div>
                        <div className={`text-[#050215]/50 font-semibold mt-2 truncate ${big ? 'text-[27px]' : 'text-[22px]'}`}>{item.role}</div>
                    </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                    <Stars size={big ? 32 : 26} />
                    <div className="text-[#050215]/40 text-[18px] font-bold mt-1 tracking-wide">via Google</div>
                </div>
            </div>
            <p className={`text-[#050215]/85 font-semibold leading-snug flex-1 ${big ? 'text-[40px]' : 'text-[29px]'}`}>
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
            <Avatar name={item.name} size={96} ring={false} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-white text-[36px] leading-none truncate">{item.name}</span>
                    {isReview && item.kind === 'review'
                        ? <span className="text-white/45 text-[25px] font-semibold truncate">· {item.role}</span>
                        : <span className="text-[#27DD36] text-[23px] font-semibold flex items-center gap-2 whitespace-nowrap">
                            <span className="h-2 w-2 rounded-full bg-[#27DD36]" />online
                          </span>}
                </div>
                <p className="text-white/75 text-[28px] font-medium leading-tight truncate">
                    {isReview && item.kind === 'review'
                        ? `"${item.quote}"`
                        : item.kind === 'chat' ? item.msgs.join('   ·   ') : ''}
                </p>
            </div>
            {isReview
                ? <div className="shrink-0"><Stars size={28} /></div>
                : item.kind === 'chat' && <div className="shrink-0 text-white/40 text-[22px] font-semibold whitespace-nowrap">{item.time}</div>}
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
                        <span className="uppercase tracking-[.34em] text-[#B5A9FF]/80 font-bold text-[26px] whitespace-nowrap">
                            Jullie maken het de moeite waard
                        </span>
                    </div>
                    <h1 className="font-display font-bold text-white leading-[0.98] text-[80px] whitespace-nowrap">Klantwaardering</h1>
                </div>
                <div className="text-right">
                    <div className="font-display text-white/40 text-[26px] font-medium">Rechtstreeks uit de inbox</div>
                    <div className="grad-text font-display font-bold text-[40px]">★ 4,9 gem. score</div>
                </div>
            </div>
            <div className="flex-1 min-h-0">{body}</div>
        </div>
    );
}
