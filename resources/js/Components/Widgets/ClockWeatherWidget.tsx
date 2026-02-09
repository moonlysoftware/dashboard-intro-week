import { useEffect, useState } from 'react';

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

export default function ClockWeatherWidget({ config, data }: ClockWeatherWidgetProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const weather = data.weather;

    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 h-full text-white">
            <div className="flex flex-col h-full justify-between">
                {/* Time */}
                <div>
                    <p className="text-6xl font-bold mb-2">{formatTime(currentTime)}</p>
                    <p className="text-xl opacity-90">{formatDate(currentTime)}</p>
                </div>

                {/* Weather */}
                {weather && (
                    <div className="mt-6 flex items-center gap-4">
                        <span className="text-6xl">{weather.icon}</span>
                        <div>
                            <p className="text-4xl font-bold">{weather.temperature}°C</p>
                            <p className="text-lg opacity-90">{weather.condition}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
