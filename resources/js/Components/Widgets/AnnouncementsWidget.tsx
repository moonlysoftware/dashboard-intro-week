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
            className="flex flex-col justify-between rounded-lg shadow-lg p-6 h-full border border-border bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('/storage/announcements/announcements.png')",
            }}
        >
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-white text-[36px] font-bold font-archia">
                    Mededelingen
                </h3>
            </div>

            <div className="space-y-3">
                {announcements.map((announcement, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between border-2 backdrop-blur-md border-white/10 bg-white/15 border-l-4 rounded-lg p-3 transition-all"
                    >
                        <h4 className="font-archia font-semibold text-white text-[30px]">
                            {announcement.title}
                        </h4>
                        <p className="text-white text-[30px] font-archia">
                            {announcement.message}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
