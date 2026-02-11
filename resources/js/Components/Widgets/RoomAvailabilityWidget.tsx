import WidgetNotConfigured from '@/Components/Widgets/WidgetNotConfigured';

interface Room {
    name: string;
    status: 'available' | 'occupied';
    next_booking?: string | null;
    available_at?: string | null;
}

interface RoomAvailabilityWidgetProps {
    config: Record<string, any>;
    data: {
        rooms?: Room[];
    };
}

export default function RoomAvailabilityWidget({ config, data }: RoomAvailabilityWidgetProps) {
    const configuredRooms: { name: string; calendar_id: string }[] = config?.rooms ?? [];
    const isConfigured = configuredRooms.some((r) => r.calendar_id?.trim());

    if (!isConfigured) {
        return <WidgetNotConfigured message="Nog geen ruimtes geconfigureerd" />;
    }

    const rooms = data.rooms || [];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ruimte Beschikbaarheid</h3>

            {rooms.length === 0 ? (
                <p className="text-gray-500">Geen ruimtes geconfigureerd</p>
            ) : (
                <div className="flex flex-col gap-3 flex-1">
                    {rooms.map((room, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100"
                        >
                            {/* Status cirkel */}
                            <div className="flex-shrink-0">
                                <span
                                    className={`block w-5 h-5 rounded-full shadow-sm ${
                                        room.status === 'available'
                                            ? 'bg-green-500 shadow-green-200'
                                            : 'bg-red-500 shadow-red-200'
                                    }`}
                                    title={room.status === 'available' ? 'Beschikbaar' : 'Bezet'}
                                />
                            </div>

                            {/* Ruimtenaam en tijdsinformatie */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{room.name}</p>
                                {room.status === 'available' ? (
                                    room.next_booking ? (
                                        <p className="text-sm text-gray-500">
                                            Bezet om {room.next_booking}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">Vrij de rest van de dag</p>
                                    )
                                ) : (
                                    room.available_at ? (
                                        <p className="text-sm text-gray-500">
                                            Vrij om {room.available_at}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">Bezet</p>
                                    )
                                )}
                            </div>

                            {/* Status label */}
                            <div className="flex-shrink-0">
                                <span
                                    className={`text-sm font-semibold ${
                                        room.status === 'available'
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}
                                >
                                    {room.status === 'available' ? 'Vrij' : 'Bezet'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
