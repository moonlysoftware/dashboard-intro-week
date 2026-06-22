interface AnnDetail {
    label: string;
    value: string;
}

interface AnnouncementContent {
    style?: "split" | "overlay";
    photo?: string;
    pos?: string;
    badge?: string;
    title?: string;
    details?: AnnDetail[];
    body?: string | string[];
    sub?: string;
    announcements?: { title?: string; message?: string }[];
}

function normalizeBody(body?: string | string[]): string[] {
    if (!body) return [];
    if (Array.isArray(body)) return body.filter(Boolean);
    return body
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
}

export function normalizeAnnouncementContent(
    content: Record<string, any> = {},
): AnnouncementContent {
    if (content.announcements?.length) {
        const first = content.announcements[0];
        return {
            style: "overlay",
            badge: "Nieuws",
            title: first.title ?? "",
            body: first.message ? [first.message] : [],
        };
    }

    const details: AnnDetail[] = content.details?.length
        ? content.details
        : ([
              content.date ? { label: "Datum", value: content.date } : null,
              content.time ? { label: "Tijd", value: content.time } : null,
              content.location
                  ? { label: "Locatie", value: content.location }
                  : null,
          ].filter(Boolean) as AnnDetail[]);

    return {
        ...content,
        details,
        body: normalizeBody(content.body),
    };
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span
            className="grad-pill inline-flex self-start rounded-full text-white font-poster font-bold whitespace-nowrap"
            style={{
                padding: "11px 30px",
                fontSize: 36,
                boxShadow: "0 16px 46px -12px rgba(178,61,240,.65)",
            }}
        >
            {children}
        </span>
    );
}

function PhotoPanel({
    photo,
    pos,
    fade,
}: {
    photo?: string;
    pos?: string;
    fade: "split" | "overlay";
}) {
    return (
        <div className="relative h-full w-full overflow-hidden">
            {photo ? (
                <img
                    src={photo}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover${fade === "split" ? " origin-center" : ""}`}
                    style={{ objectPosition: pos || "center" }}
                />
            ) : (
                <div className="absolute inset-0 imgslot opacity-60" />
            )}
        </div>
    );
}

const SPLIT_SCRIM =
    "linear-gradient(90deg, #08060f 0%, #08060f 38%, rgba(8,6,15,0.94) 44%, rgba(8,6,15,0.72) 52%, rgba(8,6,15,0.28) 62%, rgba(8,6,15,0) 72%)";

/** Variant 1 — text left, photo right (Moonly BBQ layout) */
function AnnSplit({
    photo,
    pos,
    badge,
    title,
    details = [],
    body = [],
}: AnnouncementContent) {
    const lines = normalizeBody(body);

    return (
        <div
            className="h-full w-full relative overflow-hidden"
            style={{ background: "#08060f" }}
        >
            <div className="absolute inset-0">
                <PhotoPanel photo={photo} pos={pos} fade="split" />
            </div>
            <div
                className="absolute inset-0 z-[1]"
                style={{ background: SPLIT_SCRIM }}
            />
            <div
                className="relative z-10 flex h-full flex-col justify-center px-16 py-14"
                style={{ width: "42%" }}
            >
                {badge && (
                    <div className="mb-7">
                        <Pill>{badge}</Pill>
                    </div>
                )}
                {title && (
                    <h2 className="font-poster font-bold text-white leading-[0.98] text-[76px] mb-7">
                        {title}
                    </h2>
                )}
                {details.length > 0 && (
                    <div className="flex flex-col gap-2.5 mb-7">
                        {details.map((d, i) => (
                            <div key={i} className="text-[32px] leading-tight">
                                <span className="font-poster font-medium text-white">
                                    {d.label}:{" "}
                                </span>
                                <span className="font-poster font-bold text-white">
                                    {d.value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {lines.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {lines.map((p, i) => (
                            <p
                                key={i}
                                className="text-white/45 font-manrope font-medium text-[26px] leading-[1.32] max-w-[760px]"
                            >
                                {p}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Variant 2 — full-bleed photo with text overlay bottom-left */
function AnnOverlay({
    photo,
    pos,
    badge,
    body = [],
    sub,
}: AnnouncementContent) {
    const lines = normalizeBody(body).length
        ? normalizeBody(body)
        : sub
          ? [sub]
          : [];

    return (
        <div
            className="h-full w-full relative overflow-hidden"
            style={{ background: "#08060f" }}
        >
            <PhotoPanel photo={photo} pos={pos} fade="overlay" />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(6,4,16,.08) 0%, rgba(6,4,16,0) 32%, rgba(6,4,16,.50) 68%, rgba(6,4,16,.92) 100%)",
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(75deg, rgba(6,4,16,.55) 0%, rgba(6,4,16,0) 42%)",
                }}
            />
            <div className="absolute left-0 right-0 bottom-0 px-16 pb-14 pt-24">
                {badge && (
                    <div className="mb-7">
                        <Pill>{badge}</Pill>
                    </div>
                )}
                {lines.length > 0 && (
                    <div className="flex flex-col gap-5 max-w-[1180px]">
                        {lines.map((p, i) => (
                            <p
                                key={i}
                                className="text-white font-manrope font-medium text-[40px] leading-[1.3] ann-shadow"
                            >
                                {p}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AnnouncementSlide({
    content,
}: {
    content?: AnnouncementContent | Record<string, any>;
}) {
    const c = normalizeAnnouncementContent(content || {});

    if (c.style === "overlay") {
        return (
            <AnnOverlay {...c} badge={c.badge || "Moonly Alert"} />
        );
    }

    return (
        <AnnSplit
            {...c}
            badge={c.badge || "Moonly Alert"}
            title={c.title || ""}
        />
    );
}
