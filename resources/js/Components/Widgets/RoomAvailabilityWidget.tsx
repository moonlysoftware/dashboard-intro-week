import WidgetNotConfigured from '@/Components/Widgets/WidgetNotConfigured';

interface Room {
  name: string;
  status: 'available' | 'occupied';
  next_booking?: string | null;
  available_at?: string | null;
  current_duration_minutes?: number | null;
  next_duration_minutes?: number | null;
}

interface RoomAvailabilityWidgetProps {
  config: Record<string, any>;
  data: {
    rooms?: Room[];
  };
}

// Light positions as % of the reference frame
const lightPositions = [
  { top: 16.7, left: 22.85 },
  { top: 16.7, left: 49.7 },
  { top: 16.7, left: 76.2 },
];

// Room container positions as % of the reference frame
const roomPositions = [
  { top: 35.6, left: 23 },
  { top: 35.6, left: 49.7 },
  { top: 35.6, left: 76.1 },
];

// Helper function to format duration
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

export default function RoomAvailabilityWidget({ data }: RoomAvailabilityWidgetProps) {
  const rooms = data.rooms || [];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {/* Reference frame maintaining Base.png aspect ratio */}
      <div className="relative w-full" style={{ paddingTop: '39%' }}>
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
                className={`absolute rounded-[7px] ${
                  room.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: '14.3%',
                  height: '4.6%',
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: room.status === 'available'
                    ? '0 0 12px 4px rgba(34, 197, 94, 0.6), 0 0 24px 8px rgba(34, 197, 94, 0.3)'
                    : '0 0 12px 4px rgba(239, 68, 68, 0.6), 0 0 24px 8px rgba(239, 68, 68, 0.3)',
                }}
              />
            );
          })}

          {/* Room containers positioned independently */}
          {rooms.slice(0, 3).map((room, index) => {
            const pos = roomPositions[index];
            
            // Determine what to display based on room status
            let timeDisplay = '';
            let durationDisplay = '';
            
            if (room.status === 'occupied') {
              // Show when it becomes available and how long it will be free
              timeDisplay = room.available_at || 'Occupied';
              durationDisplay = formatDuration(room.next_duration_minutes);
            } else {
              // Show when next booking starts and how long it will be occupied
              timeDisplay = room.next_booking || '';
              durationDisplay = formatDuration(room.next_duration_minutes);
            }
            
            return (
              <div
                key={`container-${index}`}
                className="absolute bg-black bg-opacity-80 text-white p-1 rounded-md text-center shadow"
                style={{
                  width: '7.0%',
                  height: '16.9%',
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  transform: 'translate(-50%, 0)',
                }}
              >
                <div className="font-archia text-[clamp(0.05rem,1.85vw,20rem)] flex items-center justify-center h-full flex-col">
                  {/* First span: Time (when available/when next booking) */}
                  <span>
                    {timeDisplay}
                  </span>
                  
                  {/* Second span: Duration (free duration if occupied, booking duration if available) */}
                  <span className="font-bold text-[clamp(0.1rem,1.4vw,24rem)] whitespace-nowrap">
                    {durationDisplay}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
