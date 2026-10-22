import { addDays, daysBetween, weekStart, type CalendarDate } from "@sendtally/core/hang";

export const OVERVIEW_WEEKS = 12;

/** One session of any kind: climbing, hangboard, and whatever training joins them. */
export type Activity<K extends string> = {
  kind: K;
  date: CalendarDate;
  minutes: number;
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
  minutes: Record<K, number>;
  /** Consecutive active weeks back from this one, or from last week while this one is empty. */
  streak: number;
};

const zeroes = <K extends string>(kinds: readonly K[]): Record<K, number> =>
  Object.fromEntries(kinds.map((k) => [k, 0])) as Record<K, number>;

const mean = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

function streakOf(dates: readonly CalendarDate[], thisWeek: CalendarDate): number {
  const active = new Set(dates.map(weekStart));
  const from = active.has(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  let streak = 0;
  while (active.has(addDays(from, -7 * streak))) streak++;
  return streak;
}

/** Per-week session counts by kind and effort across kinds, over the last `count` weeks. */
export function summariseActivity<K extends string>(
  activities: readonly Activity<K>[],
  kinds: readonly K[],
  today: CalendarDate,
  count = OVERVIEW_WEEKS
): ActivitySummary<K> {
  const thisWeek = weekStart(today);
  const first = addDays(thisWeek, -7 * (count - 1));
  const buckets = Array.from({ length: count }, (_, i) => ({
    start: addDays(first, 7 * i),
    sessions: zeroes(kinds),
    rpes: [] as number[],
  }));
  const minutes = zeroes(kinds);
  let sessions = 0;
  for (const a of activities) {
    const bucket = buckets[Math.floor(daysBetween(first, a.date) / 7)];
    if (bucket === undefined || !kinds.includes(a.kind)) continue;
    bucket.sessions[a.kind] += 1;
    minutes[a.kind] += a.minutes;
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
    minutes,
    streak: streakOf(
      activities.map((a) => a.date),
      thisWeek
    ),
  };
}
