import type { Activity } from "@sendtally/api-client";
import { daysBetween, type CalendarDate } from "@sendtally/core/hang";
import type { ExerciseSet, SetTarget, Side } from "../activities/detail";

/** What an exercise's best set is judged on: the heaviest load, the longest hold, or the most reps. */
export type ExerciseMetric = "load" | "seconds" | "reps";

export type ExerciseSession = {
  activityId: string;
  date: CalendarDate;
  /** The best done set, or the best set tried when none was done. */
  best: SetTarget;
  /** The best set's value on the metric: kg, seconds or reps. */
  value: number;
  /** No set was done: the point shows what was tried. */
  attempted: boolean;
  /** Epley's estimated one-rep max from the done sets with reps and load. */
  e1rmKg: number | null;
  /** Reps times load over the done sets. */
  volumeKg: number;
  /** The best done value on each side, when the sets had sides. */
  sides: Partial<Record<Side, number>> | null;
};

export type ExerciseSeries = {
  /** The trimmed, lowercased name every spelling shares. */
  key: string;
  /** The newest spelling. */
  name: string;
  metric: ExerciseMetric;
  /** Oldest first. */
  sessions: ExerciseSession[];
};

export type ExerciseSummary = {
  /** Sessions with at least one done set. */
  sessions: number;
  best: ExerciseSession | null;
  latest: ExerciseSession;
  /** Latest done value minus the first, on the metric. */
  change: number;
  weeks: number;
  e1rmKg: number | null;
  volumeThisMonthKg: number;
};

export const exerciseKey = (name: string): string => name.trim().toLowerCase();

export function epley(loadKg: number, reps: number): number {
  return reps === 1 ? loadKg : loadKg * (1 + reps / 30);
}

const valueOf = (set: SetTarget, metric: ExerciseMetric): number | undefined =>
  metric === "load" ? set.loadKg : metric === "seconds" ? set.seconds : set.reps;

function better(a: SetTarget, b: SetTarget, metric: ExerciseMetric): boolean {
  const [va, vb] = [valueOf(a, metric) ?? -Infinity, valueOf(b, metric) ?? -Infinity];
  return va !== vb ? va > vb : (a.reps ?? 0) > (b.reps ?? 0);
}

function bestOf<S extends SetTarget>(sets: readonly S[], metric: ExerciseMetric): S | undefined {
  return sets
    .filter((s) => valueOf(s, metric) !== undefined)
    .reduce<S | undefined>(
      (top, s) => (top === undefined || better(s, top, metric) ? s : top),
      undefined
    );
}

const lifts = (sets: readonly SetTarget[]): { reps: number; loadKg: number }[] =>
  sets.flatMap((s) =>
    s.reps !== undefined && s.reps > 0 && s.loadKg !== undefined && s.loadKg > 0
      ? [{ reps: s.reps, loadKg: s.loadKg }]
      : []
  );

function sidesOf(
  sets: readonly SetTarget[],
  metric: ExerciseMetric
): Partial<Record<Side, number>> | null {
  const sides: Partial<Record<Side, number>> = {};
  for (const side of ["L", "R"] as const) {
    const best = bestOf(
      sets.filter((s) => s.side === side),
      metric
    );
    const value = best === undefined ? undefined : valueOf(best, metric);
    if (value !== undefined) sides[side] = value;
  }
  return Object.keys(sides).length === 0 ? null : sides;
}

function sessionOf(
  activity: Pick<Activity, "id" | "date">,
  sets: readonly ExerciseSet[],
  metric: ExerciseMetric
): ExerciseSession | null {
  const done = sets.filter((s) => s.done);
  const doneBest = bestOf(done, metric);
  const best = doneBest ?? bestOf(sets, metric);
  const value = best === undefined ? undefined : valueOf(best, metric);
  if (best === undefined || value === undefined) return null;
  const liftsDone = lifts(done);
  const { done: _, ...target } = best;
  return {
    activityId: activity.id,
    date: activity.date,
    best: target,
    value,
    attempted: doneBest === undefined,
    e1rmKg:
      liftsDone.length === 0 ? null : Math.max(...liftsDone.map((l) => epley(l.loadKg, l.reps))),
    volumeKg: liftsDone.reduce((sum, l) => sum + l.reps * l.loadKg, 0),
    sides: sidesOf(done, metric),
  };
}

function metricOf(sets: readonly SetTarget[]): ExerciseMetric {
  if (sets.some((s) => s.loadKg !== undefined)) return "load";
  return sets.some((s) => s.seconds !== undefined) ? "seconds" : "reps";
}

type Logged = Pick<Activity, "id" | "date" | "startTime" | "detail">;

const chronological = (a: Logged, b: Logged): number =>
  a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** Every exercise in the user's sets bodies, each a session series, the most often logged first. */
export function exerciseSeries(activities: readonly Logged[]): ExerciseSeries[] {
  const found = new Map<
    string,
    { name: string; logs: { activity: Logged; sets: ExerciseSet[] }[] }
  >();
  for (const activity of [...activities].sort(chronological)) {
    if (activity.detail?.kind !== "sets") continue;
    const byKey = new Map<string, ExerciseSet[]>();
    for (const e of activity.detail.exercises) {
      const key = exerciseKey(e.name);
      if (key === "") continue;
      byKey.set(key, [...(byKey.get(key) ?? []), ...e.sets]);
      const entry = found.get(key) ?? { name: e.name.trim(), logs: [] };
      found.set(key, { ...entry, name: e.name.trim() });
    }
    for (const [key, sets] of byKey) found.get(key)?.logs.push({ activity, sets });
  }
  return [...found]
    .map(([key, { name, logs }]): ExerciseSeries => {
      const metric = metricOf(logs.flatMap((l) => l.sets));
      const sessions = logs
        .map((l) => sessionOf(l.activity, l.sets, metric))
        .filter((s) => s !== null);
      return { key, name, metric, sessions };
    })
    .filter((s) => s.sessions.length > 0)
    .sort(
      (a, b) =>
        b.sessions.length - a.sessions.length ||
        (b.sessions.at(-1)?.date ?? "").localeCompare(a.sessions.at(-1)?.date ?? "")
    );
}

/** The headline numbers for one exercise, or null before anything was logged. */
export function exerciseSummary(
  series: ExerciseSeries,
  today: CalendarDate
): ExerciseSummary | null {
  const latest = series.sessions.at(-1);
  if (latest === undefined) return null;
  const done = series.sessions.filter((s) => !s.attempted);
  const first = done[0];
  const last = done.at(-1);
  const best = done.reduce<ExerciseSession | null>(
    (top, s) => (top === null || better(s.best, top.best, series.metric) ? s : top),
    null
  );
  const e1rms = done.flatMap((s) => (s.e1rmKg === null ? [] : [s.e1rmKg]));
  const month = today.slice(0, 7);
  return {
    sessions: done.length,
    best,
    latest,
    change: first === undefined || last === undefined ? 0 : last.value - first.value,
    weeks:
      first === undefined || last === undefined
        ? 0
        : Math.round(daysBetween(first.date, last.date) / 7),
    e1rmKg: e1rms.length === 0 ? null : Math.max(...e1rms),
    volumeThisMonthKg: series.sessions
      .filter((s) => s.date.startsWith(month))
      .reduce((sum, s) => sum + s.volumeKg, 0),
  };
}
