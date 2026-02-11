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

// Light positions as % of the reference frame
const lightPositions = [
  { top: 5.3, left: 22.85 },
  { top: 5.3, left: 49.7 },
  { top: 5.3, left: 76.2 },
];

// Room container positions as % of the reference frame
const roomPositions = [
  { top: 27.6, left: 23 },
  { top: 27.6, left: 49.7 },
  { top: 27.6, left: 76.1 },
];

export default function RoomAvailabilityWidget({ data }: RoomAvailabilityWidgetProps) {
  const rooms = data.rooms || [];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {/* Reference frame maintaining Base.png aspect ratio */}
      <div className="relative w-full" style={{ paddingTop: '33.33%' }}>
        {/* Base image */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: "url('/storage/meetingRooms/Base.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 83%',
          }}
        >
          {/* Lights */}
          {rooms.slice(0, 3).map((room, index) => {
            const pos = lightPositions[index];
            return (
              <div
                key={index}
                className={`absolute rounded-[7px] shadow-sm ${
                  room.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: '14.3%',
                  height: '4.6%',
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}

          {/* Room containers positioned independently */}
          {rooms.slice(0, 3).map((room, index) => {
            const pos = roomPositions[index];
            return (
              <div
                key={`container-${index}`}
                className="absolute bg-black bg-opacity-80 text-white p-1 rounded-md text-xs text-center shadow"
                style={{
                  width: '7.0%', // match light width for consistency
                  height: '19%',    // enough height for text
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  transform: 'translate(-50%, 0)',
                }}
              >
                <div className="font-semibold truncate">{room.name}</div>
                <div className="truncate text-[0.7rem]">
                  {room.status === 'available'
                    ? 'Available now'
                    : room.available_at
                    ? `Available at ${room.available_at}`
                    : 'Occupied'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
