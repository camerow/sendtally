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
  isClimbingMetric,
  metricOf,
  valueOf,
  type ExerciseMetric,
  type ExerciseSeries,
} from "../statistics/exercises";

/** How a best set moved: on its metric, or on reps when the metric held. Zero is the same. */
export type SetChange = { metric: ExerciseMetric; by: number };

type Dated = { id: string; date: CalendarDate; startTime?: string | null };

const chronological = (a: Dated, b: Dated): number =>
  a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** Today's best against last time's: the metric first, then reps. */
export function setChange(today: SetDone, last: SetDone, metric: ExerciseMetric): SetChange {
  const by = (valueOf(today, metric) ?? 0) - (valueOf(last, metric) ?? 0);
  if (by !== 0 || metric === "reps") return { metric, by };
  return { metric: "reps", by: (today.reps ?? 0) - (last.reps ?? 0) };
}

/** The best set by the sets' own metric. */
export const bestSet = (sets: readonly SetDone[]): SetDone | undefined =>
  bestOf(sets, metricOf(sets));

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
