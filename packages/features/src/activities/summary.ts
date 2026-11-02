import type { Activity } from "@sendtally/api-client";
import type { CalendarDate, HangSession, SetDone } from "@sendtally/core/hang";
import {
  bestOf,
  exerciseKey,
  isClimbingMetric,
  metricOf,
  metricTotal,
  valueOf,
  type ExerciseMetric,
  type ExerciseSeries,
} from "../statistics/exercises";

/** How a best set moved: on its metric, or on reps when the metric held. Zero is the same. */
export type SetChange = { metric: ExerciseMetric; by: number };

export type ExerciseResult = {
  exercise: string;
  sets: SetDone[];
  /** The index of the best set, or null when no set has anything to compare. */
  best: number | null;
  /** The best set of the previous session that did it, and its day. */
  last: { set: SetDone; date: CalendarDate } | null;
  change: SetChange | null;
};

type Dated = { id: string; date: CalendarDate; startTime?: string | null };

type Logged = Dated & Pick<Activity, "workoutId" | "done">;

const chronological = (a: Dated, b: Dated): number =>
  a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** What came before `id`, newest first: everything logged earlier, or earlier the same day. */
function before<T extends Dated>(id: string, all: readonly T[]): T[] {
  const sorted = [...all].sort(chronological);
  const at = sorted.findIndex((x) => x.id === id);
  return sorted.slice(0, Math.max(0, at)).reverse();
}

/** Today's best against last time's: the metric first, then reps. */
export function setChange(today: SetDone, last: SetDone, metric: ExerciseMetric): SetChange {
  const by = (valueOf(today, metric) ?? 0) - (valueOf(last, metric) ?? 0);
  if (by !== 0 || metric === "reps") return { metric, by };
  return { metric: "reps", by: (today.reps ?? 0) - (last.reps ?? 0) };
}

/** The best set by the sets' own metric. */
export const bestSet = (sets: readonly SetDone[]): SetDone | undefined =>
  bestOf(sets, metricOf(sets));

/**
 * Each exercise done, its best set, and how it compares with the previous session that did
 * it: of the same workout when there is one, else any.
 */
export function exerciseResults(activity: Logged, activities: readonly Logged[]): ExerciseResult[] {
  const earlier = before(activity.id, activities).filter(
    (a) => activity.workoutId === null || a.workoutId === activity.workoutId
  );
  return activity.done
    .filter((d) => d.sets.length > 0)
    .map((d): ExerciseResult => {
      const key = exerciseKey(d.exercise);
      const previous = earlier.flatMap((a) => {
        const sets = a.done.find((e) => exerciseKey(e.exercise) === key && e.sets.length > 0);
        return sets === undefined ? [] : [{ date: a.date, sets: sets.sets }];
      })[0];
      const metric = metricOf([...d.sets, ...(previous?.sets ?? [])]);
      const best = bestOf(d.sets, metric);
      const lastBest = previous === undefined ? undefined : bestOf(previous.sets, metric);
      const counted =
        isClimbingMetric(metric) && previous !== undefined
          ? { metric, by: metricTotal(d.sets, metric) - metricTotal(previous.sets, metric) }
          : null;
      return {
        exercise: d.exercise,
        sets: d.sets,
        best: best === undefined ? null : d.sets.indexOf(best),
        last:
          lastBest === undefined || previous === undefined
            ? null
            : { set: lastBest, date: previous.date },
        change:
          counted ??
          (best === undefined || lastBest === undefined ? null : setChange(best, lastBest, metric)),
      };
    });
}

/** Every session of the same workout, this one included, newest first; none without a workout. */
export function pastSessions<T extends Dated & { workoutId: string | null }>(
  session: T,
  all: readonly T[]
): T[] {
  if (session.workoutId === null) return [];
  return all
    .filter((s) => s.workoutId === session.workoutId)
    .sort(chronological)
    .reverse();
}

export type SeriesPoint = {
  index: number;
  /** Against the session before it in the series; null for the first. */
  change: SetChange | null;
  /** Better than every session before it, with at least one before. */
  bestYet: boolean;
};

/** Where an activity sits in an exercise's series, or null when it did not do it. */
export function seriesPoint(series: ExerciseSeries, activityId: string): SeriesPoint | null {
  const index = series.sessions.findIndex((s) => s.activityId === activityId);
  const at = series.sessions[index];
  if (at === undefined) return null;
  const earlier = series.sessions.slice(0, index);
  const previous = earlier.at(-1);
  const change =
    previous === undefined
      ? null
      : isClimbingMetric(series.metric)
        ? { metric: series.metric, by: at.value - previous.value }
        : setChange(at.best, previous.best, series.metric);
  return {
    index,
    change,
    bestYet: earlier.length > 0 && earlier.every((s) => at.value > s.value),
  };
}

type HangLog = Pick<HangSession, "protocol" | "pct" | "loadKg"> & {
  done?: HangSession["done"];
};

/**
 * Each set's hangs and load: as the session saved them, else spread from its share held, the
 * hangs filling from the first set on, every set at the session's load.
 */
export function hangSets({ protocol, pct, loadKg, done = [] }: HangLog): SetDone[] {
  const saved = done.find((d) => d.item === 0)?.sets;
  if (saved !== undefined && saved.length > 0) return saved;
  const held = Math.round((protocol.sets * protocol.reps * pct) / 100);
  return Array.from({ length: protocol.sets }, (_, s) => ({
    reps: Math.max(0, Math.min(protocol.reps, held - s * protocol.reps)),
    weightKg: loadKg,
  }));
}

/** Each hang of each set, held or let go, with each set's load: hangs fill from the left. */
export type HangGrid = { rows: boolean[][]; loads: number[]; held: number; total: number };

export function hangGrid(session: HangLog): HangGrid {
  const { reps } = session.protocol;
  const sets = hangSets(session);
  const rows = sets.map((s) => Array.from({ length: reps }, (_, r) => r < (s.reps ?? reps)));
  return {
    rows,
    loads: sets.map((s) => s.weightKg ?? session.loadKg),
    held: rows.flat().filter(Boolean).length,
    total: rows.flat().length,
  };
}

type Hang = Dated & Pick<HangSession, "workoutId" | "gripId" | "loadKg" | "protocol">;

/** Every session on this grip of the same kind, oldest first: the added weight over time. */
export const gripSessions = <T extends Hang>(session: T, all: readonly T[]): T[] =>
  all
    .filter((s) => s.gripId === session.gripId && s.protocol.kind === session.protocol.kind)
    .sort(chronological);
