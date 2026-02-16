import WidgetNotConfigured from "@/Components/Widgets/WidgetNotConfigured";

interface Announcement {
    title: string;
    message: string;
}

interface AnnouncementsWidgetProps {
    config: Record<string, any>;
    data: {
        announcements?: Announcement[];
    };
}

export default function AnnouncementsWidget({
    config: _config,
    data,
}: AnnouncementsWidgetProps) {
    const announcements = data.announcements ?? [];

    if (announcements.length === 0) {
        return (
            <WidgetNotConfigured message="Nog geen mededelingen toegevoegd" />
        );
    }

    return (
        <div
            className="flex flex-col rounded-lg shadow-lg h-full border border-border bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('/storage/announcements/announcements.png')",
                padding: 'clamp(1rem, 1.5vw, 2.5rem)',
            }}
        >
            <div className="flex items-center" style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 2rem)' }}>
                <h3 className="text-white font-bold font-archia" style={{ fontSize: 'clamp(2rem, 3.5vw, 5rem)' }}>
                    Mededelingen
                </h3>
            </div>

            <div className="flex-1 flex flex-col justify-end" style={{ gap: 'clamp(0.5rem, 1vh, 1.5rem)' }}>
                {announcements.map((announcement, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between border-2 backdrop-blur-md border-white/10 bg-white/15 border-l-4 rounded-lg transition-all"
                        style={{ padding: 'clamp(0.5rem, 0.8vw, 1.25rem)' }}
                    >
                        <h4 className="font-archia font-semibold text-white" style={{ fontSize: 'clamp(1.5rem, 2.8vw, 4rem)' }}>
                            {announcement.title}
                        </h4>
                        <p className="text-white font-archia" style={{ fontSize: 'clamp(1.5rem, 2.8vw, 4rem)' }}>
                            {announcement.message}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
