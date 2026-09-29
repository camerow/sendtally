import type { CalendarDate, Weekday } from "./types";

const DAY_MS = 86_400_000;

// Calendar arithmetic runs on UTC midnights, where every day is 24 hours long,
// so a daylight-saving change in the user's zone can never shift a date.
const toUtc = (d: CalendarDate): number => {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, day ?? 1);
};

const fromUtc = (ms: number): CalendarDate => new Date(ms).toISOString().slice(0, 10);

export function calendarDate(year: number, monthIndex: number, day: number): CalendarDate {
  return fromUtc(Date.UTC(year, monthIndex, day));
}

export function todayIn(now: Date = new Date()): CalendarDate {
  return calendarDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(d: CalendarDate, n: number): CalendarDate {
  return fromUtc(toUtc(d) + n * DAY_MS);
}

export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** A real "YYYY-MM-DD" date: "2026-02-30" is not one. */
export function isCalendarDate(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && addDays(text, 0) === text;
}

export function weekday(d: CalendarDate): Weekday {
  return ((new Date(toUtc(d)).getUTCDay() + 6) % 7) as Weekday;
}

export function weekStart(d: CalendarDate): CalendarDate {
  return addDays(d, -weekday(d));
}

export function monthStart(d: CalendarDate): CalendarDate {
  return `${d.slice(0, 7)}-01`;
}

export function addMonths(d: CalendarDate, n: number): CalendarDate {
  const date = new Date(toUtc(monthStart(d)));
  return calendarDate(date.getUTCFullYear(), date.getUTCMonth() + n, 1);
}

export function daysInMonth(d: CalendarDate): number {
  return daysBetween(monthStart(d), addMonths(d, 1));
}

/** A local Date at noon on that day, for `Intl` formatting only. */
export function toLocalDate(d: CalendarDate): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, day ?? 1, 12);
}

export const minDate = (a: CalendarDate, b: CalendarDate): CalendarDate => (a < b ? a : b);

export const maxDate = (a: CalendarDate, b: CalendarDate): CalendarDate => (a > b ? a : b);
