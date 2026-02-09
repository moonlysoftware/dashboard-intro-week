interface Birthday {
    name: string;
    date: string;
    age: number;
}

interface BirthdayWidgetProps {
    config: Record<string, any>;
    data: {
        birthdays?: Birthday[];
    };
}

export default function BirthdayWidget({ config, data }: BirthdayWidgetProps) {
    const birthdays = data.birthdays || [];

    const getDaysUntil = (dateString: string) => {
        const birthday = new Date(dateString);
        const today = new Date();
        const diffTime = birthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Verjaardagen</h3>
            </div>

            {birthdays.length === 0 ? (
                <p className="text-gray-500">Geen aankomende verjaardagen</p>
            ) : (
                <div className="space-y-3">
                    {birthdays.map((birthday, index) => {
                        const daysUntil = getDaysUntil(birthday.date);
                        return (
                            <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">{birthday.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {formatDate(birthday.date)} - wordt {birthday.age} jaar
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {daysUntil === 0 ? 'Vandaag!' : daysUntil === 1 ? 'Morgen' : `${daysUntil} dagen`}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
