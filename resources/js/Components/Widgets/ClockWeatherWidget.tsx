import { useEffect, useState } from "react";

interface Weather {
    temperature: number;
    condition: string;
    icon: string;
}

interface ClockWeatherWidgetProps {
    config: Record<string, any>;
    data: {
        time?: string;
        date?: string;
        weather?: Weather;
    };
}

export default function ClockWeatherWidget({
    config,
    data,
}: ClockWeatherWidgetProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const weather = data.weather;

    return (
        <div
            className="font-archia bg-gradient-to-br bg-cover bg-center bg-no-repeat rounded-lg shadow-lg h-full text-white"
            style={{
                backgroundImage: "url('/storage/weather/weather.png')",
                padding: 'clamp(1rem, 1.5vw, 2.5rem)',
            }}
        >
            <div className="flex flex-col h-full justify-between">
                {/* Time */}
                <div>
                    <p className="font-bold mb-2" style={{ fontSize: 'clamp(2rem, 3.5vw, 5rem)' }}>
                        {formatTime(currentTime)}
                    </p>
                    <p className="opacity-90" style={{ fontSize: 'clamp(1.2rem, 1.8vw, 3rem)' }}>
                        {formatDate(currentTime)}
                    </p>
                </div>

                {/* Weather */}
                {weather && (
                    <div className="mt-6 flex items-center backdrop-blur-md rounded-md bg-white/15 border-2 border-white/10 w-max"
                        style={{ gap: 'clamp(0.75rem, 1vw, 1.5rem)', padding: 'clamp(0.75rem, 1vw, 1.5rem)' }}
                    >
                        <span style={{ fontSize: 'clamp(3rem, 5vw, 7rem)' }}>{weather.icon}</span>
                        <div>
                            <p className="font-bold" style={{ fontSize: 'clamp(2rem, 3.5vw, 5rem)' }}>
                                {weather.temperature}°C
                            </p>
                            <p className="opacity-90" style={{ fontSize: 'clamp(1rem, 1.6vw, 2.5rem)' }}>
                                {weather.condition}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
