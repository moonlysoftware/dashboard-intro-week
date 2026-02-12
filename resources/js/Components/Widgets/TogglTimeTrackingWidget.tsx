import WidgetNotConfigured from "@/Components/Widgets/WidgetNotConfigured";
import { useEffect, useState } from "react";

interface MissingHoursUser {
    name: string;
    hours_missing: string;
    hours_clocked: string;
    percentage: number;
}

interface TogglTimeTrackingWidgetProps {
    config: Record<string, any>;
    data: {
        week_number?: number;
        year?: number;
        total_users?: number;
        users_complete?: number;
        users_incomplete?: number;
        percentage_complete?: number;
        missing_hours_users?: MissingHoursUser[];
    };
}

function getFridayCountdown(): string {
    const now = new Date();

    const dayNameRaw = now.toLocaleDateString("nl-NL", {
        weekday: "long",
    });
    const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);

    const currentTime = now.toLocaleTimeString().slice(0, 5);

    const target = new Date(now);
    const currentDay = now.getDay(); // 0 = Sunday, 5 = Friday
    const friday = 5;

    let daysUntilFriday = friday - currentDay;

    if (
        daysUntilFriday < 0 ||
        (daysUntilFriday === 0 && now.getHours() >= 17)
    ) {
        daysUntilFriday += 7;
    }

    target.setDate(now.getDate() + daysUntilFriday);
    target.setHours(17, 0, 0, 0);

    const diff = target.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${dayName}\n${currentTime}\n${days}d ${hours}u ${minutes}m te gaan!`;
}

export default function TogglTimeTrackingWidget({
    config: _config,
    data,
}: TogglTimeTrackingWidgetProps) {
    const isConfigured = data && Object.keys(data).length > 0;

    const [fridayCountdown, setFridayCountdown] = useState("");

    useEffect(() => {
        const update = () => {
            setFridayCountdown(getFridayCountdown());
        };

        update();
        const interval = setInterval(update, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!isConfigured) {
        return (
            <WidgetNotConfigured message="Toggl API nog niet geconfigureerd" />
        );
    }

    const {
        week_number = 0,
        year = new Date().getFullYear(),
        total_users = 0,
        users_complete = 0,
        users_incomplete = 0,
        percentage_complete = 0,
        missing_hours_users = [],
    } = data;

    return (
        <div
            className="flex flex-col justify-between rounded-lg shadow-lg p-6 h-full border border-border bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/storage/toggl/toggl.jpg')",
            }}
        >
            <div className="flex items-center  gap-3 mb-4 ">
                <div className="flex items-center justify-between w-full">
                    <h3 className="text-white text-[36px] font-bold text-foreground">
                        Toggl Wall of Shame
                    </h3>
                    <p className="text-white/50 text-[36px]">
                        Week {week_number} - {year}
                    </p>
                </div>
            </div>

            {/* Overall Progress 
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-foreground">Totaal Voortgang</span>
                    <span className="text-sm font-bold text-foreground">{percentage_complete}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${getProgressColor(percentage_complete)}`}
                        style={{ width: `${percentage_complete}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>✓ {users_complete} compleet</span>
                    <span>✗ {users_incomplete} incompleet</span>
                    <span>Σ {total_users} totaal</span>
                </div>
            </div>
            */}

            {/* Missing Hours Users */}
            {missing_hours_users.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <p className="text-foreground font-semibold">
                        Iedereen heeft alle uren ingevuld!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Geweldig werk team!
                    </p>
                </div>
            ) : (
                <div className="flex w-full space-y-2 ">
                    {/* <h4 className="text-white/50 text-sm font-semibold mb-3">
                        Nog in te vullen ({missing_hours_users.length})
                    </h4> */}

                    <div className="space-y-2 max-h-96 overflow-y-auto w-full">
                        {missing_hours_users.slice(0, 3).map((user, index) => (
                            <div
                                key={index}
                                className={`flex flex-col justify-center border-2 border-white/10 bg-white/15 border-l-4 rounded-lg p-3 transition-all`}
                            >
                                <div className="flex justify-between items-center mb-2 ">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-white text-[30px]">
                                            {user.name}
                                        </p>
                                        <p className="text-[30px] text-white/50">
                                            | {user.hours_clocked.slice(0, 5)}{" "}
                                            geklokt!
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all"
                                                style={{
                                                    width: `${user.percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col text-red-500 w-full justify-end">
                        <div
                            className=" text-white text-[36px] text-right"
                            style={{ whiteSpace: "pre-line" }}
                        >
                            {fridayCountdown}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
