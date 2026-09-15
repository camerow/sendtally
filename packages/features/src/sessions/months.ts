import { formatDate } from "../i18n";
import type { LogItem } from "../journal/types";

export type SessionMonth = {
  key: string;
  year: number;
  month: number;
  name: string;
  label: string;
  items: LogItem[];
};

function formatMonth(month: number, style: "long" | "short"): string {
  if (month < 1 || month > 12) return "";
  return formatDate(new Date(Date.UTC(2000, month - 1, 1)), { month: style, timeZone: "UTC" });
}

export function monthShortName(month: number): string {
  return formatMonth(month, "short");
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthName(month: number): string {
  return formatMonth(month, "long");
}

export function monthLabel(year: number, month: number): string {
  return `${monthName(month)} ${year}`;
}

export function logMonths(items: LogItem[]): SessionMonth[] {
  const byKey = new Map<string, SessionMonth>();
  for (const item of items) {
    const at = new Date(item.at);
    const year = at.getUTCFullYear();
    const month = at.getUTCMonth() + 1;
    const key = monthKey(year, month);
    const existing = byKey.get(key);
    if (existing) existing.items.push(item);
    else
      byKey.set(key, {
        key,
        year,
        month,
        name: monthName(month),
        label: monthLabel(year, month),
        items: [item],
      });
  }
  return [...byKey.values()].sort((a, b) => b.key.localeCompare(a.key));
}
