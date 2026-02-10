import birthdaysData from '@/data/birthdays.json';

interface BirthdayWidgetProps {
    config: Record<string, any>;
    data: Record<string, any>;
}

interface Person {
    id: number;
    name: string;
    birthdate: string;
    image: string;
}

function getNextBirthday(birthdate: string): Date {
    const [, month, day] = birthdate.split('-').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisYear = new Date(today.getFullYear(), month - 1, day);
    if (thisYear >= today) return thisYear;

    return new Date(today.getFullYear() + 1, month - 1, day);
}

function daysUntil(birthdate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = getNextBirthday(birthdate);
    return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isBirthdayToday(birthdate: string): boolean {
    const today = new Date();
    const [, month, day] = birthdate.split('-').map(Number);
    return today.getMonth() + 1 === month && today.getDate() === day;
}

function getAgeThisBirthday(birthdate: string): number {
    const [birthYear] = birthdate.split('-').map(Number);
    const next = getNextBirthday(birthdate);
    return next.getFullYear() - birthYear;
}

function formatDate(birthdate: string): string {
    const [, month, day] = birthdate.split('-').map(Number);
    const date = new Date(2000, month - 1, day);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

export default function BirthdayWidget({ config: _config, data: _data }: BirthdayWidgetProps) {
    const people = birthdaysData as Person[];

    const birthdayToday = people.filter((p) => isBirthdayToday(p.birthdate));

    const upcoming = people
        .filter((p) => !isBirthdayToday(p.birthdate))
        .sort((a, b) => daysUntil(a.birthdate) - daysUntil(b.birthdate));

    const minDays = upcoming.length > 0 ? daysUntil(upcoming[0].birthdate) : null;
    const nextGroup = upcoming.filter(
        (p) => daysUntil(p.birthdate) === minDays
    );

    if (birthdayToday.length > 0) {
        return (
            <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-pink-400 to-purple-500 rounded-lg shadow-lg h-full flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[120px] leading-none flex flex-wrap gap-4 justify-center items-center">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <span key={i}>🎂</span>
                    ))}
                </div>

                <p className="text-lg font-semibold uppercase tracking-widest mb-4 drop-shadow">
                    Gefeliciteerd!
                </p>

                <div className="flex flex-wrap justify-center gap-6 z-10">
                    {birthdayToday.map((person) => (
                        <div key={person.id} className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                                <img
                                    src={`/storage/birthdays/${person.image}`}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="font-bold text-xl drop-shadow">{person.name}</p>
                            <p className="text-white/90 text-sm font-medium">
                                wordt vandaag {getAgeThisBirthday(person.birthdate)} jaar!
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (nextGroup.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 h-full flex items-center justify-center">
                <p className="text-gray-500">Geen verjaardagen gevonden</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Volgende verjaardag
            </p>

            <div className="flex flex-wrap gap-4 flex-1 items-center justify-center">
                {nextGroup.map((person) => {
                    const days = daysUntil(person.birthdate);
                    return (
                        <div
                            key={person.id}
                            className="flex items-center gap-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex-1 min-w-[200px]"
                        >
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-200 flex-shrink-0 shadow">
                                <img
                                    src={`/storage/birthdays/${person.image}`}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{person.name}</p>
                                <p className="text-sm text-gray-500">
                                    {formatDate(person.birthdate)} &middot; wordt {getAgeThisBirthday(person.birthdate)} jaar
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-3xl font-extrabold text-purple-600 leading-none">
                                    {days}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {days === 1 ? 'dag' : 'dagen'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
