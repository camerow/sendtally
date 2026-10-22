import type { Activity } from "@sendtally/api-client";
import { daysBetween, type CalendarDate, type SetDone } from "@sendtally/core/hang";

/** What an exercise's best set is judged on: the heaviest load, the longest hold, or the most reps. */
export type ExerciseMetric = "load" | "seconds" | "reps";

export type ExerciseSession = {
  activityId: string;
  date: CalendarDate;
  /** The best set done. */
  best: SetDone;
  /** The best set's value on the metric: kg, seconds or reps. */
  value: number;
  /** Epley's estimated one-rep max from the sets with reps and weight. */
  e1rmKg: number | null;
  /** Reps times weight over the sets. */
  volumeKg: number;
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
  /** Sessions with at least one set done. */
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

const valueOf = (set: SetDone, metric: ExerciseMetric): number | undefined =>
  metric === "load" ? set.weightKg : metric === "seconds" ? set.onS : set.reps;

function better(a: SetDone, b: SetDone, metric: ExerciseMetric): boolean {
  const [va, vb] = [valueOf(a, metric) ?? -Infinity, valueOf(b, metric) ?? -Infinity];
  return va !== vb ? va > vb : (a.reps ?? 0) > (b.reps ?? 0);
}

function bestOf(sets: readonly SetDone[], metric: ExerciseMetric): SetDone | undefined {
  return sets
    .filter((s) => valueOf(s, metric) !== undefined)
    .reduce<SetDone | undefined>(
      (top, s) => (top === undefined || better(s, top, metric) ? s : top),
      undefined
    );
}

const lifts = (sets: readonly SetDone[]): { reps: number; loadKg: number }[] =>
  sets.flatMap((s) =>
    s.reps !== undefined && s.reps > 0 && s.weightKg !== undefined && s.weightKg > 0
      ? [{ reps: s.reps, loadKg: s.weightKg }]
      : []
  );

function sessionOf(
  activity: Pick<Activity, "id" | "date">,
  sets: readonly SetDone[],
  metric: ExerciseMetric
): ExerciseSession | null {
  const best = bestOf(sets, metric);
  const value = best === undefined ? undefined : valueOf(best, metric);
  if (best === undefined || value === undefined) return null;
  const done = lifts(sets);
  return {
    activityId: activity.id,
    date: activity.date,
    best,
    value,
    e1rmKg: done.length === 0 ? null : Math.max(...done.map((l) => epley(l.loadKg, l.reps))),
    volumeKg: done.reduce((sum, l) => sum + l.reps * l.loadKg, 0),
  };
}

function metricOf(sets: readonly SetDone[]): ExerciseMetric {
  if (sets.some((s) => s.weightKg !== undefined)) return "load";
  return sets.some((s) => s.onS !== undefined) ? "seconds" : "reps";
}

type Logged = Pick<Activity, "id" | "date" | "startTime" | "done">;

const chronological = (a: Logged, b: Logged): number =>
  a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** Every exercise the user logged sets of, each a session series, the most often logged first. */
export function exerciseSeries(activities: readonly Logged[]): ExerciseSeries[] {
  const found = new Map<string, { name: string; logs: { activity: Logged; sets: SetDone[] }[] }>();
  for (const activity of [...activities].sort(chronological)) {
    const byKey = new Map<string, SetDone[]>();
    for (const e of activity.done) {
      const key = exerciseKey(e.exercise);
      if (key === "" || e.sets.length === 0) continue;
      byKey.set(key, [...(byKey.get(key) ?? []), ...e.sets]);
      const entry = found.get(key) ?? { name: e.exercise.trim(), logs: [] };
      found.set(key, { ...entry, name: e.exercise.trim() });
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
  const done = series.sessions;
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
