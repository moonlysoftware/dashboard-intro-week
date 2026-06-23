import jubileaData from '@/data/jubilea.json';

export interface JubileumPerson {
    kind: 'jubileum';
    name: string;
    date: string;
    turns: string;
    soon: string;
    photo?: string;
    years: number;
    days: number;
}

function getNextAnniversary(startdate: string): Date {
    const [, month, day] = startdate.split('-').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = new Date(today.getFullYear(), month - 1, day);
    if (thisYear >= today) return thisYear;
    return new Date(today.getFullYear() + 1, month - 1, day);
}

function daysUntil(startdate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((getNextAnniversary(startdate).getTime() - today.getTime()) / 86_400_000);
}

function yearsAtNextAnniversary(startdate: string): number {
    const [startYear] = startdate.split('-').map(Number);
    return getNextAnniversary(startdate).getFullYear() - startYear;
}

function formatDate(startdate: string): string {
    const [, month, day] = startdate.split('-').map(Number);
    return new Date(2000, month - 1, day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

/** Upcoming work anniversaries (≥ 1 year), sorted by nearest date. */
export function getUpcomingJubilea(limit = 3): JubileumPerson[] {
    return jubileaData
        .map((p) => ({ ...p, days: daysUntil(p.startdate), years: yearsAtNextAnniversary(p.startdate) }))
        .filter((p) => p.years >= 1)
        .sort((a, b) => a.days - b.days)
        .slice(0, limit)
        .map((p) => {
            let soon = `Over ${p.days} dagen`;
            if (p.days === 0) soon = 'Vandaag';
            else if (p.days === 1) soon = 'Morgen';

            return {
                kind: 'jubileum' as const,
                name: p.name,
                date: formatDate(p.startdate),
                turns: `${p.years} jaar bij Moonly`,
                soon,
                photo: `/storage/birthdays/${p.image}`,
                years: p.years,
                days: p.days,
            };
        });
}
