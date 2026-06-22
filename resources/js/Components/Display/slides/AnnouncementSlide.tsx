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
        <span className="slide-pill self-start">
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

/** Fades from the text column into the photo on the left edge of the image panel */
const SPLIT_PHOTO_BLEND =
    "linear-gradient(90deg, #08060f 0%, rgba(8,6,15,0.94) 6%, rgba(8,6,15,0.72) 14%, rgba(8,6,15,0.42) 26%, rgba(8,6,15,0.14) 40%, transparent 54%)";

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
            className="h-full w-full flex overflow-hidden"
            style={{ background: "#08060f" }}
        >
            <div className="relative z-10 flex h-full w-1/4 shrink-0 flex-col justify-center px-10 py-14">
                {badge && (
                    <div className="mb-7">
                        <Pill>{badge}</Pill>
                    </div>
                )}
                {title && (
                    <h2 className="slide-title mb-7">
                        {title}
                    </h2>
                )}
                {details.length > 0 && (
                    <div className="flex flex-col gap-2.5 mb-7">
                        {details.map((d, i) => (
                            <div key={i} className="leading-tight">
                                <span className="slide-label">
                                    {d.label}:{" "}
                                </span>
                                <span className="slide-date font-normal">
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
                                className="slide-body-muted max-w-[760px]"
                            >
                                {p}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative h-full w-3/4 min-w-0">
                <PhotoPanel photo={photo} pos={pos} fade="split" />
                <div
                    className="pointer-events-none absolute inset-0 z-[1]"
                    style={{ background: SPLIT_PHOTO_BLEND }}
                />
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
                                className="slide-body text-white ann-shadow"
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
        return <AnnOverlay {...c} badge={c.badge || "Moonly Alert"} />;
    }

    return (
        <AnnSplit
            {...c}
            badge={c.badge || "Moonly Alert"}
            title={c.title || ""}
        />
    );
}
