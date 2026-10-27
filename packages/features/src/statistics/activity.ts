import { addDays, daysBetween, weekStart, type CalendarDate } from "@sendtally/core/hang";

/** One session of any kind: climbing, hangboard, and whatever training joins them. */
export type Activity<K extends string> = {
  kind: K;
  date: CalendarDate;
  rpe: number | null;
};

export type ActivityWeek<K extends string> = {
  start: CalendarDate;
  sessions: Record<K, number>;
  /** Mean effort of the week's scored sessions, every kind together. */
  effort: number | null;
};

export type ActivitySummary<K extends string> = {
  /** Oldest first, ending with this week. */
  weeks: ActivityWeek<K>[];
  sessions: number;
};

const zeroes = <K extends string>(kinds: readonly K[]): Record<K, number> =>
  Object.fromEntries(kinds.map((k) => [k, 0])) as Record<K, number>;

const mean = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

export const firstWeek = (today: CalendarDate, count: number): CalendarDate =>
  addDays(weekStart(today), -7 * (count - 1));

export function weekIndex(first: CalendarDate, date: CalendarDate, count: number): number | null {
  const i = Math.floor(daysBetween(first, date) / 7);
  return i >= 0 && i < count ? i : null;
}

/** Per-week session counts by kind and effort across kinds, over the last `count` weeks. */
export function summariseActivity<K extends string>(
  activities: readonly Activity<K>[],
  kinds: readonly K[],
  today: CalendarDate,
  count: number
): ActivitySummary<K> {
  const first = firstWeek(today, count);
  const buckets = Array.from({ length: count }, (_, i) => ({
    start: addDays(first, 7 * i),
    sessions: zeroes(kinds),
    rpes: [] as number[],
  }));
  let sessions = 0;
  for (const a of activities) {
    const i = weekIndex(first, a.date, count);
    const bucket = i === null ? undefined : buckets[i];
    if (bucket === undefined || !kinds.includes(a.kind)) continue;
    bucket.sessions[a.kind] += 1;
    sessions += 1;
    if (a.rpe !== null) bucket.rpes.push(a.rpe);
  }
  return {
    weeks: buckets.map(({ start, sessions: byKind, rpes }) => ({
      start,
      sessions: byKind,
      effort: mean(rpes),
    })),
    sessions,
  };
}
