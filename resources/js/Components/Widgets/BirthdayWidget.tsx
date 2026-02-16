import birthdaysData from '@/data/birthdays.json';

interface BirthdayWidgetProps {
    config: Record<string, any>;
    data: Record<string, any>;
    birthdayIndex?: number;
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

export default function BirthdayWidget({ config: _config, data: _data, birthdayIndex = 0 }: BirthdayWidgetProps) {
    const people = birthdaysData as Person[];

    // Build one sorted list: today's birthdays first, then upcoming sorted by days until
    const allSorted = [
        ...people.filter(p => isBirthdayToday(p.birthdate)),
        ...people.filter(p => !isBirthdayToday(p.birthdate))
                 .sort((a, b) => daysUntil(a.birthdate) - daysUntil(b.birthdate)),
    ];

    const person = allSorted[birthdayIndex] ?? null;

    const backgroundLayers = (personImage?: string) => (
        <div style={{
            position: 'absolute',
            aspectRatio: '1144 / 930',
            minWidth: '100%',
            minHeight: '100%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'hidden',
            zIndex: 0,
        }}>
            <img
                src="/storage/birthdays/astronaut-closeup.png"
                alt=""
                className="absolute inset-0 w-full h-full grayscale pointer-events-none"
            />

            {personImage && (
                <img
                    src={`/storage/birthdays/${personImage}`}
                    alt=""
                    className="absolute pointer-events-none"
                    style={{ zIndex: 10, left: '2%', top: '15%', width: '90%', height: 'auto' }}
                />
            )}

            <img
                src="/storage/birthdays/astronaut-closup-cutout.png"
                alt=""
                className="absolute inset-0 w-full h-full grayscale pointer-events-none"
                style={{ zIndex: 20 }}
            />
        </div>
    );

    if (!person) {
        return (
            <div
                className="relative overflow-hidden rounded-lg shadow-lg h-full flex items-center justify-center"
            >
                {backgroundLayers()}
                <p className="text-white/80 drop-shadow" style={{ zIndex: 30, position: 'relative' }}>
                    Geen verjaardagen gevonden
                </p>
            </div>
        );
    }

    if (isBirthdayToday(person.birthdate)) {
        return (
            <div
                className="relative overflow-hidden rounded-lg shadow-lg h-full"
            >
                {backgroundLayers(person.image)}

                <div
                    className="absolute top-0 left-0 right-0 flex flex-col items-center text-white text-center"
                    style={{
                        zIndex: 30,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)',
                        padding: 'clamp(1rem, 2vw, 2rem)',
                        paddingBottom: 'clamp(3rem, 6vw, 6rem)',
                    }}
                >
                    <p className="font-black uppercase tracking-widest drop-shadow"
                        style={{ fontSize: 'clamp(2rem, 4.5vw, 4.5rem)' }}>
                        Gefeliciteerd!
                    </p>
                </div>

                <div
                    className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-white text-center"
                    style={{
                        zIndex: 30,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                        padding: 'clamp(1rem, 2vw, 2rem)',
                        paddingTop: 'clamp(4rem, 8vw, 8rem)',
                    }}
                >
                    <p className="font-bold drop-shadow" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 5rem)' }}>
                        {person.name}
                    </p>
                    <p className="font-semibold uppercase tracking-widest drop-shadow" style={{ fontSize: 'clamp(1.2rem, 3vw, 2.5rem)' }}>
                        wordt vandaag {getAgeThisBirthday(person.birthdate)} jaar!
                    </p>
                </div>
            </div>
        );
    }

    const days = daysUntil(person.birthdate);

    return (
        <div
            className="relative overflow-hidden rounded-lg shadow-lg h-full"
        >
            {backgroundLayers(person.image)}

            <div
                className="absolute top-0 left-0 right-0 flex flex-col items-center text-white text-center"
                style={{
                    zIndex: 30,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)',
                    padding: 'clamp(1rem, 2vw, 2rem)',
                    paddingBottom: 'clamp(3rem, 6vw, 6rem)',
                }}
            >
                <p className="font-black uppercase tracking-widest drop-shadow"
                    style={{ fontSize: 'clamp(2rem, 6.5vw, 4.5rem)' }}>
                    Bijna jarig!
                </p>
            </div>

            <div
                className="absolute bottom-0 left-0 right-0 flex flex-row items-baseline justify-center gap-3 text-white text-center flex-wrap"
                style={{
                    zIndex: 30,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    padding: 'clamp(1rem, 2vw, 2rem)',
                    paddingTop: 'clamp(4rem, 8vw, 8rem)',
                }}
            >
                <p className="font-bold drop-shadow whitespace-nowrap" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 5rem)' }}>
                    {person.name}
                </p>
                <p className="font-semibold uppercase tracking-widest drop-shadow whitespace-nowrap" style={{ fontSize: 'clamp(1.2rem, 3vw, 2.5rem)' }}>
                    wordt over {days} {days === 1 ? 'dag' : 'dagen'} {getAgeThisBirthday(person.birthdate)} jaar
                </p>
            </div>
        </div>
    );
}
