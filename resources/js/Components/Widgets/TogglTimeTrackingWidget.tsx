import WidgetNotConfigured from "@/Components/Widgets/WidgetNotConfigured";

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

export default function TogglTimeTrackingWidget({
    config: _config,
    data,
}: TogglTimeTrackingWidgetProps) {
    const isConfigured = data && Object.keys(data).length > 0;

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

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return "bg-green-500";
        if (percentage >= 70) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getUserStatusColor = (percentage: number) => {
        if (percentage >= 95)
            return "border-green-500 bg-green-50 dark:bg-green-900/20";
        if (percentage >= 85)
            return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
    };

    const getUserStatusBadge = (percentage: number) => {
        if (percentage >= 95)
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        if (percentage >= 85)
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    };

    return (
        <div className="bg-black rounded-lg shadow-lg p-6 h-full border border-border">
            <div className="flex items-center gap-3 mb-4">
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
                <div className="space-y-2">
                    {/* <h4 className="text-white/50 text-sm font-semibold mb-3">
                        Nog in te vullen ({missing_hours_users.length})
                    </h4> */}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {missing_hours_users.map((user, index) => (
                            <div
                                key={index}
                                className={`border-l-4 rounded-lg p-3 transition-all ${getUserStatusColor(user.percentage)}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Ingevuld: {user.hours_clocked}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-full ${getUserStatusBadge(user.percentage)}`}
                                    >
                                        {user.percentage}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-destructive">
                                            Nog {user.hours_missing} te gaan
                                        </p>
                                        <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1">
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
                </div>
            )}
        </div>
    );
}
