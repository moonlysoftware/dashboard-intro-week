import birthdaysData from '@/data/birthdays.json';

export interface BirthdayPerson {
    name: string;
    date: string;
    turns: string;
    soon: string;
    photo?: string;
    age?: number;
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

/** Upcoming birthdays from the team list, sorted by nearest date. */
export function getUpcomingBirthdays(limit = 3): BirthdayPerson[] {
    return birthdaysData
        .map((p) => ({ ...p, days: daysUntil(p.birthdate) }))
        .sort((a, b) => a.days - b.days)
        .slice(0, limit)
        .map((p) => {
            let soon = `Over ${p.days} dagen`;
            if (p.days === 0) soon = 'Vandaag';
            else if (p.days === 1) soon = 'Morgen';

            return {
                name: p.name,
                date: formatDate(p.birthdate),
                turns: `Wordt ${getAgeThisBirthday(p.birthdate)}`,
                soon,
                photo: p.image ? `/storage/birthdays/${p.image}` : undefined,
                age: getAgeThisBirthday(p.birthdate),
            };
        });
}

export const TEAM_BIRTHDAY_COUNT = birthdaysData.length;
