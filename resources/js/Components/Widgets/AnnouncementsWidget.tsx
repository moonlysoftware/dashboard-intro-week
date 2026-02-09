interface Announcement {
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
}

interface AnnouncementsWidgetProps {
    config: Record<string, any>;
    data: {
        announcements?: Announcement[];
    };
}

export default function AnnouncementsWidget({ config, data }: AnnouncementsWidgetProps) {
    const announcements = data.announcements || [];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-red-500 bg-red-50';
            case 'medium':
                return 'border-yellow-500 bg-yellow-50';
            case 'low':
                return 'border-blue-500 bg-blue-50';
            default:
                return 'border-gray-500 bg-gray-50';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Mededelingen</h3>
            </div>

            {announcements.length === 0 ? (
                <p className="text-gray-500">Geen mededelingen</p>
            ) : (
                <div className="space-y-3">
                    {announcements.map((announcement, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border-l-4 ${getPriorityColor(announcement.priority)}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadge(
                                        announcement.priority
                                    )}`}
                                >
                                    {announcement.priority.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700">{announcement.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
