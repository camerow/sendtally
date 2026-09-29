import { addDays, daysBetween, weekStart } from "./calendar";
import { plannedWork } from "./protocol";
import type { CalendarDate, HangSession } from "./types";

export const TREND_WEEKS = 16;

export const byDate = (a: HangSession, b: HangSession): number =>
  a.date.localeCompare(b.date) || a.id.localeCompare(b.id);

/** One series per workout and grip, oldest first. */
export function seriesFor<T extends HangSession>(
  sessions: readonly T[],
  workoutId: string,
  gripId: string
): T[] {
  return sessions.filter((s) => s.workoutId === workoutId && s.gripId === gripId).sort(byDate);
}

export type TrendSummary = {
  first: number;
  last: number;
  best: number;
  topAttempt: HangSession | null;
  avgRpe: number | null;
  avgPct: number;
  work: number;
  weeks: number;
};

export function summarise(
  series: readonly HangSession[],
  today: CalendarDate
): TrendSummary | null {
  const oldest = series[0];
  if (oldest === undefined) return null;
  const complete = series.filter((s) => s.pct >= 100);
  const counted = (complete.length > 0 ? complete : series).map((s) => s.loadKg);
  const best = Math.max(...counted);
  const topAttempt =
    series.filter((s) => s.pct < 100 && s.loadKg > best).sort((a, b) => b.loadKg - a.loadKg)[0] ??
    null;
  const rpes = series.flatMap((s) => (s.rpe === null ? [] : [s.rpe]));
  return {
    first: counted[0] ?? 0,
    last: counted[counted.length - 1] ?? 0,
    best,
    topAttempt,
    avgRpe: rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null,
    avgPct: Math.round(series.reduce((a, s) => a + s.pct, 0) / series.length),
    work: Math.round(series.reduce((a, s) => a + (plannedWork(s.protocol) * s.pct) / 100, 0)),
    weeks: Math.max(1, Math.round(daysBetween(oldest.date, today) / 7)),
  };
}

/** Consecutive weeks, counting back from this one, with at least one session. */
export function weekStreak(sessions: readonly HangSession[], today: CalendarDate): number {
  const weeks = new Set(sessions.map((s) => weekStart(s.date)));
  let streak = 0;
  while (weeks.has(addDays(weekStart(today), -7 * streak))) streak++;
  return streak;
}

/** Sessions per week, oldest first, ending with this week. */
export function weeklyCounts(
  sessions: readonly HangSession[],
  today: CalendarDate,
  weeks = TREND_WEEKS
): number[] {
  const thisWeek = weekStart(today);
  const counts = Array.from({ length: weeks }, () => 0);
  for (const s of sessions) {
    const index = weeks - 1 - Math.floor(daysBetween(weekStart(s.date), thisWeek) / 7);
    if (index >= 0 && index < weeks) counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
}
