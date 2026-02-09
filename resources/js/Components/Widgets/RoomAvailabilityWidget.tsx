interface Room {
    name: string;
    status: 'available' | 'occupied';
    next_booking?: string;
    available_at?: string;
}

interface RoomAvailabilityWidgetProps {
    config: Record<string, any>;
    data: {
        rooms?: Room[];
    };
}

export default function RoomAvailabilityWidget({ config, data }: RoomAvailabilityWidgetProps) {
    const rooms = data.rooms || [];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Ruimte Beschikbaarheid</h3>
            </div>

            {rooms.length === 0 ? (
                <p className="text-gray-500">Geen ruimtes beschikbaar</p>
            ) : (
                <div className="space-y-3">
                    {rooms.map((room, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg ${
                                room.status === 'available'
                                    ? 'bg-green-50 border-l-4 border-green-500'
                                    : 'bg-red-50 border-l-4 border-red-500'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-900">{room.name}</p>
                                    {room.status === 'available' && room.next_booking && (
                                        <p className="text-sm text-gray-600">
                                            Volgende boeking: {room.next_booking}
                                        </p>
                                    )}
                                    {room.status === 'occupied' && room.available_at && (
                                        <p className="text-sm text-gray-600">
                                            Beschikbaar om: {room.available_at}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                            room.status === 'available'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {room.status === 'available' ? '✓ Beschikbaar' : '✗ Bezet'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
