import type { Activity } from "@sendtally/api-client";
import {
  doseProtocol,
  hangKindOf,
  hangSessionItems,
  heldSet,
  type CalendarDate,
  type HangKind,
  type HangRun as GripRun,
  type HangSession,
  type SetDone,
} from "@sendtally/core/hang";
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
import { formatNumber, t } from "../i18n";

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
  /** The mean RPE of the sets rated, against the target they were logged with; null when none was rated. */
  effort: SetEffort | null;
};

export type SetEffort = { actual: number; target: number | null };

/** The mean RPE of the rated sets, to one decimal, or null when none was rated. */
export function setEffort(sets: readonly SetDone[], target?: number): SetEffort | null {
  const rated = sets.flatMap((s) => (s.rpe === undefined ? [] : [s.rpe]));
  if (rated.length === 0) return null;
  const actual = Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10;
  return { actual, target: target ?? null };
}

/** "RPE 8.8" and "· aimed 8", drawn in two weights; the second is empty with no target. */
export const setEffortText = ({ actual, target }: SetEffort): [string, string] => [
  t("hang.rpeValue", { value: formatNumber(actual) }),
  target === null ? "" : t("summary.setAimed", { target: formatNumber(target) }),
];

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
        effort: setEffort(d.sets, d.targetRpe),
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
  if (saved !== undefined) return saved;
  const held = Math.round((protocol.sets * protocol.reps * pct) / 100);
  return Array.from({ length: protocol.sets }, (_, s) => ({
    reps: Math.max(0, Math.min(protocol.reps, held - s * protocol.reps)),
    weightKg: loadKg,
  }));
}

/** Each hang of each set, held or let go, with each set's load: hangs fill from the left. */
export type HangGrid = { rows: boolean[][]; loads: number[]; held: number; total: number };

const gridOf = (sets: readonly SetDone[], reps: number, loadKg: number): HangGrid => {
  const rows = sets.map((s) => Array.from({ length: reps }, (_, r) => r < (s.reps ?? reps)));
  return {
    rows,
    loads: sets.map((s) => s.weightKg ?? loadKg),
    held: rows.flat().filter(Boolean).length,
    total: rows.flat().length,
  };
};

/** One grip a session ran, as its card draws it: its edge, each set's hangs and load, and each set's RPE where rated. */
export type HangGripGrid = HangGrid & {
  gripId: string;
  kind: HangKind;
  edgeMm: number;
  rpes: (number | undefined)[];
  /** Each set's seconds on, which a set of one hang reads as its time held. */
  seconds: (number | undefined)[];
};

type HangRun = HangLog & Pick<HangSession, "gripId" | "edgeMm">;

/** Every grip a session ran that held a hang, in the order it ran: a grip that held none trained nothing. */
export function hangGrids(session: HangRun): HangGripGrid[] {
  const done = session.done ?? [];
  return hangSessionItems({ ...session, done }).flatMap(({ exercise, dose }, item) => {
    const first = item === 0;
    const sets = first ? hangSets(session) : (done.find((d) => d.item === item)?.sets ?? []);
    if (!sets.some(heldSet)) return [];
    return [
      {
        ...gridOf(sets, dose.reps ?? 1, session.loadKg),
        gripId: exercise,
        kind: first ? session.protocol.kind : hangKindOf(dose),
        edgeMm: first ? session.edgeMm : (sets[0]?.edgeMm ?? dose.edgeMm ?? 0),
        rpes: sets.map((s) => s.rpe),
        seconds: sets.map((s) => s.onS),
      },
    ];
  });
}

/**
 * Every grip a session ran that held a hang, each as a session of that grip alone, for what
 * follows a grip over time: the first is the session itself; a later grip runs the dose it saved,
 * at its edge and top load, complete when it held every hang it asked. A grip that held none
 * trained nothing, so its history, best and statistics leave it out.
 */
export function gripRuns<T extends GripRun>(session: T): T[] {
  const { done } = session;
  return hangSessionItems(session).flatMap(({ exercise, dose }, item): T[] => {
    if (item === 0) return hangSets(session).some(heldSet) ? [session] : [];
    const sets = done.find((d) => d.item === item)?.sets ?? [];
    if (!sets.some(heldSet)) return [];
    const grid = gridOf(sets, dose.reps ?? 1, session.loadKg);
    return [
      {
        ...session,
        gripId: exercise,
        protocol: doseProtocol(session.protocol.name, dose),
        edgeMm: sets[0]?.edgeMm ?? dose.edgeMm ?? 0,
        loadKg: Math.max(...grid.loads),
        pct: grid.total === 0 ? 0 : Math.round((100 * grid.held) / grid.total),
        done: [{ item: 0, exercise, sets }],
      } as T,
    ];
  });
}

/** Hangs held of hangs asked, and each set's load, over every grip a session ran. */
export type HangTotals = Pick<HangGrid, "held" | "total" | "loads">;

export const hangTotals = (session: HangRun): HangTotals =>
  hangGrids(session).reduce<HangTotals>(
    (sum, g) => ({
      held: sum.held + g.held,
      total: sum.total + g.total,
      loads: [...sum.loads, ...g.loads],
    }),
    { held: 0, total: 0, loads: [] }
  );

type Hang = Dated & HangRun;

/** A session's top load on one grip. */
export type GripLoad = { id: string; loadKg: number };

/**
 * Every session that ran this grip with the same kind, oldest first, at its top load there: the
 * added weight over time. None when every one hung at bodyweight, which has no weight to chart.
 */
export function gripLoads(
  grip: Pick<HangGripGrid, "gripId" | "kind">,
  all: readonly Hang[]
): GripLoad[] {
  const on = [...all].sort(chronological).flatMap((s) =>
    hangGrids(s)
      .filter((g) => g.gripId === grip.gripId && g.kind === grip.kind)
      .slice(0, 1)
      .map((g) => ({ id: s.id, loadKg: Math.max(0, ...g.loads) }))
  );
  return on.every((s) => s.loadKg === 0) ? [] : on;
}

/**
 * Each load's bar as a share of the chart's height, from zero: equal loads draw equal full bars and
 * the rest in proportion. Assisted loads run from the most assisted up to zero.
 */
export function loadShares(loads: readonly number[]): number[] {
  const [lo, hi] = [Math.min(0, ...loads), Math.max(0, ...loads)];
  return loads.map((kg) => (kg - lo) / (hi - lo || 1));
}
