import { addDays, daysBetween, weekday } from "./calendar";
import type { ClimbStyle } from "../effort";
import type { GradeScale } from "../grades";
import type { Intervals } from "./intervals";
import type { GripMeasure } from "./exercise";
import { isTimed, totalSeconds } from "./protocol";
import type { CalendarDate, HangKind, Protocol, TimeUnit, TimeUnits, Weekday } from "./types";

export const WORKOUT_KINDS = ["hangboard", "climbing", "strength", "mobility", "other"] as const;

export type WorkoutKind = (typeof WORKOUT_KINDS)[number];

/** What a workout trains for, in the order a season runs. Unset reads as General. */
export const FOCI = [
  "strength",
  "power",
  "power_endurance",
  "endurance",
  "conditioning",
  "skill",
  "recovery",
] as const;

export type Focus = (typeof FOCI)[number];

/**
 * One prescription for any kind of training. Strength: sets, reps, weightKg.
 * Hangboard: reps are hangs of onS with offS between, on edgeMm; no onS is a
 * ground pull of reps lifts, and an edgeMm of 0 one held for onS. Intervals: sets are rounds of onS work and offS rest.
 */
export type Dose = {
  sets: number;
  reps?: number;
  weightKg?: number;
  onS?: number;
  offS?: number;
  edgeMm?: number;
  setRestS?: number;
  /** What an alternating dose is called next to its letter, such as Heavy. */
  name?: string;
};

export const DOSE_FIELDS = [
  "sets",
  "reps",
  "weightKg",
  "onS",
  "offS",
  "edgeMm",
  "setRestS",
] as const satisfies readonly (keyof Dose)[];

/**
 * A climb logged on the session tally inside a set: its grade or circuit, how many goes
 * it took, and whether it went. A circuit's colour is one of the gym circuit colours.
 */
export type SetClimb = {
  grade: string;
  scale: GradeScale;
  tries: number;
  sent: boolean;
  style?: ClimbStyle;
  circuit?: { id: string; label: string; colour: string };
  name?: string;
};

/** One set as it was done. A climbing exercise's set holds the climbs logged in it. */
export type SetDone = Omit<Dose, "sets" | "name"> & { climbs?: SetClimb[] };

/**
 * One exercise of a workout. One dose is the same every session; with more, sessions
 * take them in turn. A hangboard item's exercise is its grip id.
 */
export type Item = { exercise: string; doses: Dose[] };

/** One exercise as one session runs it: the dose that session takes, and its turn when it alternates. */
export type SessionItem = { exercise: string; dose: Dose; turn?: number };

/** A library workout of any kind. */
export type Workout = {
  id: string;
  kind: WorkoutKind;
  name: string;
  description: string;
  /** Ignored for hangboard, whose duration is counted from its items. */
  minutes: number | null;
  targetRpe: number | null;
  items: Item[];
  /** The rest between one item and the next; none at zero. */
  exerciseRestS: number;
  focus: Focus | null;
};

/** What a hangboard workout rests between exercises unless it says otherwise. */
export const DEFAULT_EXERCISE_REST_S = 180;

/** A new workout rests between exercises on the hangboard only. */
export const defaultExerciseRestS = (kind: WorkoutKind): number =>
  kind === "hangboard" ? DEFAULT_EXERCISE_REST_S : 0;

/** A run of weeks from a start date. */
export type Block = {
  id: string;
  name: string;
  start: CalendarDate;
  weeks: number;
  /** Kept by the API for older app builds; the apps neither read nor write it. */
  focus: Focus | null;
};

/**
 * A library workout planned on weekdays: inside a block for its weeks, or with
 * no block from `start` until deleted. No weekdays is a one-off on `start` alone.
 * It holds no copy of the workout.
 */
export type Membership = {
  id: string;
  workoutId: string;
  blockId: string | null;
  weekdays: Weekday[];
  start: CalendarDate;
};

/** What one block week changes about one dose of one item, counted from the workout as written. */
export type WeekChange = {
  membershipId: string;
  week: number;
  dose: number;
  item: number;
  change: Partial<Dose>;
};

/** One item of a logged session: the sets done, named so history never needs the workout. */
export type ItemDone = { item: number; exercise: string; sets: SetDone[] };

/**
 * The plan a logged session ran, all null when it was logged on its own, and the focus
 * it recorded when it started, which later changes to the workout or block leave alone.
 */
export type PlanLink = {
  membershipId: string | null;
  week: number | null;
  focus: Focus | null;
};

/** The focus a session records: its workout's own, else none, which is general. */
export const focusOf = (workout: Pick<Workout, "focus"> | undefined): Focus | null =>
  workout?.focus ?? null;

/** The dose session `n` of a workout takes from an item: its doses in turn. */
export const doseIndex = (item: Pick<Item, "doses">, n: number): number =>
  n % Math.max(1, item.doses.length);

/** How many sessions before every item is back on its first dose: the most doses any item has. */
export const turnsOf = (items: readonly Pick<Item, "doses">[]): number =>
  Math.max(1, ...items.map((i) => i.doses.length));

/** An item as session `n` of the workout runs it. */
function sessionItem(item: Item, n: number): SessionItem {
  const turn = doseIndex(item, n);
  const run = { exercise: item.exercise, dose: item.doses[turn] ?? { sets: 1 } };
  return item.doses.length > 1 ? { ...run, turn } : run;
}

/** Every item as session `n` of the workout runs it. */
export const sessionItems = (items: readonly Item[], n: number): SessionItem[] =>
  items.map((i) => sessionItem(i, n));

/** A, B, C: how a dose is named by its turn. */
export const letterOf = (dose: number): string => String.fromCharCode(65 + dose);

/** A workout as it was written before items took turns: whole variations, one per session. */
export type VariationsWorkout = { variations: { items: SessionItem[] }[] };

const sameExercise = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Folds whole variations into items that take turns, item by item, when every variation
 * holds the same exercises in the same order. A dose no variation changes is kept once.
 * Null when the variations do not line up.
 */
export function foldVariations({ variations }: VariationsWorkout): Item[] | null {
  const [first, ...rest] = variations;
  if (first === undefined) return [];
  const lineUp = rest.every(
    (v) =>
      v.items.length === first.items.length &&
      v.items.every((item, i) => sameExercise(item.exercise, first.items[i]?.exercise ?? ""))
  );
  if (!lineUp) return null;
  return first.items.map((item, i) => {
    const doses = variations.map((v) => v.items[i]?.dose ?? item.dose);
    const same = doses.every((d) => JSON.stringify(d) === JSON.stringify(item.dose));
    return { exercise: item.exercise, doses: same ? [item.dose] : doses };
  });
}

/** Exclusive. */
export const blockEnd = (b: Pick<Block, "start" | "weeks">): CalendarDate =>
  addDays(b.start, b.weeks * 7);

/** 1-based week of the block a date falls in, or null outside it. */
export function blockWeekOn(b: Pick<Block, "start" | "weeks">, d: CalendarDate): number | null {
  if (d < b.start || d >= blockEnd(b)) return null;
  return Math.floor(daysBetween(b.start, d) / 7) + 1;
}

/**
 * Whether the membership lands on a date, inside its block: one of its weekdays
 * from its start, or with no weekdays its start alone.
 */
export function occursOn(
  m: Pick<Membership, "weekdays" | "start">,
  block: Pick<Block, "start" | "weeks"> | null,
  d: CalendarDate
): boolean {
  const day =
    m.weekdays.length === 0 ? d === m.start : d >= m.start && m.weekdays.includes(weekday(d));
  return day && (block === null || blockWeekOn(block, d) !== null);
}

/** One date a membership lands on, as a calendar lists it. */
export type PlannedDay = {
  date: CalendarDate;
  membershipId: string;
  workoutId: string;
  blockId: string | null;
};

/** Every date each membership lands on from `from` to `to` (exclusive), by date then membership order. */
export function occurrencesIn(
  memberships: readonly Membership[],
  blocks: readonly Block[],
  from: CalendarDate,
  to: CalendarDate
): PlannedDay[] {
  const blockOf = (m: Membership): Block | null =>
    m.blockId === null ? null : (blocks.find((b) => b.id === m.blockId) ?? null);
  const days: PlannedDay[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) {
    for (const m of memberships) {
      // A membership whose block is gone plans nothing.
      const block = blockOf(m);
      if ((m.blockId !== null && block === null) || !occursOn(m, block, d)) continue;
      days.push({ date: d, membershipId: m.id, workoutId: m.workoutId, blockId: m.blockId });
    }
  }
  return days;
}

export type Prescribed = {
  workout: Pick<Workout, "items">;
  membershipId: string;
  /** How many sessions of the workout came before this one. */
  session: number;
  /** The block week, or null outside a block, which is always as written. */
  week: number | null;
};

/** The items as the session runs them, with that week's changes laid over each dose. */
export function prescription(changes: readonly WeekChange[], p: Prescribed): SessionItem[] {
  return p.workout.items.map((item, i) => {
    const dose = doseIndex(item, p.session);
    const run = sessionItem(item, p.session);
    const change =
      p.week === null
        ? undefined
        : changes.find(
            (c) =>
              c.membershipId === p.membershipId &&
              c.week === p.week &&
              c.dose === dose &&
              c.item === i
          );
    return change === undefined ? run : { ...run, dose: { ...run.dose, ...change.change } };
  });
}

/** The fields of `target` that differ from `written`: what a week stores to reach it. */
export function changeFrom(written: Dose, target: Dose): Partial<Dose> {
  const change: Partial<Dose> = {};
  for (const field of DOSE_FIELDS) {
    const value = target[field];
    if (value !== undefined && value !== written[field]) change[field] = value;
  }
  return change;
}

/** A hangboard dose with time hangs, unless it has no edge; without time it is a ground pull in lifts. */
export function gripMeasureOf(dose: Dose): GripMeasure {
  if (dose.onS === undefined || dose.onS <= 0) return "repsWeight";
  return dose.edgeMm === 0 ? "secondsWeight" : "hang";
}

export const hangKindOf = (dose: Dose): HangKind =>
  gripMeasureOf(dose) === "hang" ? "hang" : "pull";

/** What the hang timer runs for one hangboard item. */
export function doseProtocol(name: string, dose: Dose): Protocol {
  const timed = gripMeasureOf(dose) !== "repsWeight";
  return {
    name,
    kind: hangKindOf(dose),
    hangS: timed ? (dose.onS ?? 0) : 0,
    restS: timed ? (dose.offS ?? 0) : 0,
    reps: dose.reps ?? 1,
    sets: dose.sets,
    setRestS: dose.setRestS ?? 0,
  };
}

/** A timer protocol as a dose, leaving out what it does not have. */
export function protocolDose(p: Protocol): Dose {
  return {
    sets: p.sets,
    reps: p.reps,
    ...(isTimed(p) ? { onS: p.hangS } : {}),
    ...(isTimed(p) && p.restS > 0 ? { offS: p.restS } : {}),
    ...(p.kind === "pull" && isTimed(p) ? { edgeMm: 0 } : {}),
    ...(p.setRestS > 0 ? { setRestS: p.setRestS } : {}),
  };
}

const unitOf = (seconds: number): TimeUnit => (seconds >= 60 && seconds % 60 === 0 ? "min" : "s");

/** Whole minutes read as minutes, anything else as seconds. */
export const timeUnitsOf = (p: Pick<Protocol, "hangS" | "restS" | "setRestS">): TimeUnits => ({
  hangS: unitOf(p.hangS),
  restS: unitOf(p.restS),
  setRestS: unitOf(p.setRestS),
});

/**
 * Items run as a circuit: each round does every item once, for as many rounds as the most
 * sets, resting after each its rest, else its rest between sets. An exercise done on each side
 * plays twice, left then right.
 */
export function intervalsOf(
  items: readonly SessionItem[],
  eachSide: (exercise: string) => boolean = () => false
): Intervals {
  return {
    rounds: Math.max(1, ...items.map((i) => i.dose.sets)),
    steps: items.map((i) => ({
      label: i.exercise,
      ...(eachSide(i.exercise) ? { side: "each" as const } : {}),
      ...(i.dose.onS === undefined
        ? { measure: "count" as const, count: i.dose.reps ?? 1 }
        : { measure: "time" as const, seconds: i.dose.onS }),
      ...(i.dose.weightKg === undefined ? {} : { loadKg: i.dose.weightKg }),
      restAfter: i.dose.offS ?? i.dose.setRestS ?? 0,
    })),
  };
}

/** Seconds a session's items take as the hang timer runs each one: no rest after the last hang or set. */
export const itemsSeconds = (items: readonly SessionItem[]): number =>
  items.reduce((sum, i) => sum + totalSeconds(doseProtocol(i.exercise, i.dose)), 0);

/** Seconds a hangboard session takes as the timer runs it: every item, with the rest between exercises between them. */
export const hangboardSeconds = (items: readonly SessionItem[], exerciseRestS: number): number =>
  itemsSeconds(items) + Math.max(0, items.length - 1) * exerciseRestS;

/** Every set of every item done as prescribed. */
export function doneAsPrescribed(items: readonly SessionItem[]): ItemDone[] {
  return items.map(({ exercise, dose: { sets, name: _, ...set } }, item) => ({
    item,
    exercise,
    sets: Array.from({ length: sets }, () => ({ ...set })),
  }));
}
