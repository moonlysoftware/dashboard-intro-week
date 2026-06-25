import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** YYYY-MM-DD in the browser's local timezone (matches HTML date inputs). */
export function localDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("sv-SE")
}

/** True while content should still show on the given local date (inclusive until date). */
export function isWithinAvailableUntil(
  until: string | null | undefined,
  today: string = localDateString(),
): boolean {
  return !until || today <= until
}

export function isAvailableUntilExpired(
  until: string | null | undefined,
  today: string = localDateString(),
): boolean {
  return !!until && !isWithinAvailableUntil(until, today)
}
