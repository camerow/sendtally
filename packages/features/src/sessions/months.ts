import type { SessionRow } from "@sendtally/api-client";

export type SessionMonth = {
  key: string;
  year: number;
  month: number;
  name: string;
  label: string;
  sessions: SessionRow[];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT_NAMES = MONTH_NAMES.map((m) => m.slice(0, 3).toUpperCase());

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

export function monthLabel(year: number, month: number): string {
  return `${monthName(month)} ${year}`;
}

export function sessionMonths(sessions: SessionRow[]): SessionMonth[] {
  const byKey = new Map<string, SessionMonth>();
  for (const session of sessions) {
    const start = new Date(session.start_at);
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + 1;
    const key = monthKey(year, month);
    const existing = byKey.get(key);
    if (existing) existing.sessions.push(session);
    else
      byKey.set(key, {
        key,
        year,
        month,
        name: monthName(month),
        label: monthLabel(year, month),
        sessions: [session],
      });
  }
  return [...byKey.values()].sort((a, b) => b.key.localeCompare(a.key));
}
