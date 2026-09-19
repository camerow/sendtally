import { formatDate, t, type MessageKey } from "../i18n";
import type { TrendRange } from "./types";

export const DAY_MS = 24 * 3_600_000;
const WEEK_MS = 7 * DAY_MS;

/** `label` names the whole bucket for the readout, `axis` is the short tick under it. */
export type Bucket = { start: number; end: number; axis: string; label: string };

const RANGE_KEYS: Record<TrendRange, MessageKey> = {
  "7d": "trends.range7d",
  "1m": "trends.range1m",
  "3m": "trends.range3m",
  "6m": "trends.range6m",
  ytd: "trends.rangeYtd",
  "1y": "trends.range1y",
  all: "trends.rangeAll",
};

export function rangeLabel(range: TrendRange): string {
  return t(RANGE_KEYS[range]);
}

const utc = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  ...options,
  timeZone: "UTC",
});

export function dayStart(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

function trailingDays(now: Date, days: number): Bucket[] {
  const today = dayStart(now.getTime());
  const out: Bucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = today - i * DAY_MS;
    const date = new Date(start);
    out.push({
      start,
      end: start + DAY_MS,
      axis: formatDate(date, utc({ weekday: "short" })),
      label: formatDate(date, utc({ weekday: "long", month: "short", day: "numeric" })),
    });
  }
  return out;
}

function trailingWeeks(now: Date, weeks: number): Bucket[] {
  const out: Bucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = now.getTime() - (i + 1) * WEEK_MS;
    const date = formatDate(new Date(start), utc({ month: "short", day: "numeric" }));
    out.push({ start, end: start + WEEK_MS, axis: date, label: t("trends.weekOf", { date }) });
  }
  return out;
}

function monthsFrom(firstMs: number, now: Date): Bucket[] {
  const first = new Date(firstMs);
  const out: Bucket[] = [];
  let y = first.getUTCFullYear();
  let m = first.getUTCMonth();
  while (y < now.getUTCFullYear() || (y === now.getUTCFullYear() && m <= now.getUTCMonth())) {
    const start = Date.UTC(y, m, 1);
    const date = new Date(start);
    out.push({
      start,
      end: Date.UTC(y, m + 1, 1),
      axis: formatDate(date, utc({ month: "short" })),
      label: formatDate(date, utc({ month: "long", year: "numeric" })),
    });
    m += 1;
    if (m === 12) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function trailingMonths(now: Date, months: number): Bucket[] {
  return monthsFrom(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1), now);
}

function yearsFrom(firstMs: number, now: Date): Bucket[] {
  const out: Bucket[] = [];
  for (let y = new Date(firstMs).getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
    out.push({
      start: Date.UTC(y, 0, 1),
      end: Date.UTC(y + 1, 0, 1),
      axis: String(y),
      label: String(y),
    });
  }
  return out;
}

/** Session times are the climber's wall clock stored as UTC, so every bucket is cut in UTC. */
export function bucketsFor(range: TrendRange, now: Date, firstMs: number | null): Bucket[] {
  switch (range) {
    case "7d":
      return trailingDays(now, 7);
    case "1m":
      return trailingWeeks(now, 4);
    case "3m":
      return trailingWeeks(now, 13);
    case "6m":
      return trailingMonths(now, 6);
    case "ytd":
      return trailingMonths(now, now.getUTCMonth() + 1);
    case "1y":
      return trailingMonths(now, 12);
    case "all": {
      const first = firstMs ?? now.getTime();
      const months = monthsFrom(first, now);
      return months.length > 24 ? yearsFrom(first, now) : months;
    }
  }
}

/** The window the buckets cover, and the same length just before it for the delta. */
export function windowOf(buckets: Bucket[]): { start: number; end: number } {
  return { start: buckets[0]?.start ?? 0, end: buckets[buckets.length - 1]?.end ?? 0 };
}
