import { addDays, daysBetween, weekday } from "./calendar";
import type { Intervals } from "./intervals";
import { SECONDS_PER_LIFT, totalSeconds } from "./protocol";
import type { CalendarDate, HangKind, Protocol, TimeUnit, TimeUnits, Weekday } from "./types";

export const WORKOUT_KINDS = ["hangboard", "climbing", "strength", "mobility", "other"] as const;

export type WorkoutKind = (typeof WORKOUT_KINDS)[number];

/**
 * One prescription for any kind of training. Strength: sets, reps, weightKg.
 * Hangboard: reps are hangs of onS with offS between, on edgeMm; no onS is a
 * ground pull. Intervals: sets are rounds of onS work and offS rest.
 */
export type Dose = {
  sets: number;
  reps?: number;
  weightKg?: number;
  onS?: number;
  offS?: number;
  edgeMm?: number;
  setRestS?: number;
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

/** One set as it was done. */
export type SetDone = Omit<Dose, "sets">;

/** One exercise of a variation. A hangboard item's exercise is its grip id. */
export type Item = { exercise: string; dose: Dose };

export type Variation = { label: string; items: Item[] };

/**
 * A library workout of any kind. One variation is no rotation; with more, `pattern`
 * lists the variation each session takes in turn, so A, A, B is [0, 0, 1].
 */
export type Workout = {
  id: string;
  kind: WorkoutKind;
  name: string;
  description: string;
  /** Ignored for hangboard, whose duration is counted from its items. */
  minutes: number | null;
  targetRpe: number | null;
  variations: Variation[];
  pattern: number[];
  /** Hangboard: the rest between one item and the next. */
  exerciseRestS: number;
};

/** What a hangboard workout rests between exercises unless it says otherwise. */
export const DEFAULT_EXERCISE_REST_S = 180;

/** A run of weeks from a start date. */
export type Block = { id: string; name: string; start: CalendarDate; weeks: number };

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

/** What one block week changes about one item of one variation, counted from the workout as written. */
export type WeekChange = {
  membershipId: string;
  week: number;
  variation: number;
  item: number;
  change: Partial<Dose>;
};

/** One item of a logged session: the sets done, named so history never needs the workout. */
export type ItemDone = { item: number; exercise: string; sets: SetDone[] };

/** The plan a logged session ran, all null when it was logged on its own. */
export type PlanLink = {
  membershipId: string | null;
  week: number | null;
  variation: number | null;
};

/** Every variation in turn. */
export const defaultPattern = (variations: number): number[] =>
  Array.from({ length: Math.max(1, variations) }, (_, i) => i);

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
  workout: Pick<Workout, "variations">;
  membershipId: string;
  variation: number;
  /** The block week, or null outside a block, which is always as written. */
  week: number | null;
};

/** The variation's items with that week's changes laid over each dose. */
export function prescription(changes: readonly WeekChange[], p: Prescribed): Item[] {
  const items = p.workout.variations[p.variation]?.items ?? [];
  return items.map((item, i) => {
    const change =
      p.week === null
        ? undefined
        : changes.find(
            (c) =>
              c.membershipId === p.membershipId &&
              c.week === p.week &&
              c.variation === p.variation &&
              c.item === i
          );
    return change === undefined ? item : { ...item, dose: { ...item.dose, ...change.change } };
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

const cyclic = (n: number, length: number): number => ((n % length) + length) % length;

/**
 * The pattern step the trail of logged variations (oldest first) ended on: the
 * step whose run up to it matches the most recent sessions, so A, A, B knows
 * which A came last. -1 before any session.
 */
function lastStep(pattern: readonly number[], trail: readonly number[]): number {
  if (trail.length === 0) return -1;
  let best = -1;
  let bestScore = -1;
  pattern.forEach((_, step) => {
    let score = 0;
    while (
      score < pattern.length &&
      score < trail.length &&
      trail[trail.length - 1 - score] === pattern[cyclic(step - score, pattern.length)]
    )
      score++;
    if (score > bestScore) [best, bestScore] = [step, score];
  });
  return best;
}

/**
 * The variations the next `count` sessions take: the steps after the one the last
 * logged session matched. Goes by session, so a missed day never breaks the turn.
 */
export function upcomingVariations(
  pattern: readonly number[],
  trail: readonly number[],
  count: number
): number[] {
  const steps = pattern.length === 0 ? [0] : pattern;
  const last = lastStep(steps, trail);
  return Array.from({ length: count }, (_, k) => steps[cyclic(last + 1 + k, steps.length)] ?? 0);
}

type LoggedAgainst = { membershipId: string | null; variation: number | null; date: CalendarDate };

/** The variations logged against a membership, oldest first. */
export function variationTrail(sessions: readonly LoggedAgainst[], membershipId: string): number[] {
  return sessions
    .filter((s) => s.membershipId === membershipId && s.variation !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => s.variation ?? 0);
}

/** The variation the membership's next session takes. */
export function nextVariation(
  workout: Pick<Workout, "pattern">,
  sessions: readonly LoggedAgainst[],
  membershipId: string
): number {
  return upcomingVariations(workout.pattern, variationTrail(sessions, membershipId), 1)[0] ?? 0;
}

/** A hangboard dose with time on the edge hangs; without, it is a ground pull. */
export const hangKindOf = (dose: Dose): HangKind =>
  dose.onS !== undefined && dose.onS > 0 ? "hang" : "pull";

/** What the hang timer runs for one hangboard item. */
export function doseProtocol(name: string, dose: Dose): Protocol {
  const kind = hangKindOf(dose);
  return {
    name,
    kind,
    hangS: kind === "hang" ? (dose.onS ?? 0) : 0,
    restS: kind === "hang" ? (dose.offS ?? 0) : 0,
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
    ...(p.kind === "hang" ? { onS: p.hangS } : {}),
    ...(p.kind === "hang" && p.restS > 0 ? { offS: p.restS } : {}),
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

/** Items run as a circuit: each round does every item once, for as many rounds as the most sets. */
export function intervalsOf(items: readonly Item[]): Intervals {
  return {
    rounds: Math.max(1, ...items.map((i) => i.dose.sets)),
    steps: items.map((i) => ({
      label: i.exercise,
      ...(i.dose.onS === undefined
        ? { measure: "count" as const, count: i.dose.reps ?? 1 }
        : { measure: "time" as const, seconds: i.dose.onS }),
      ...(i.dose.weightKg === undefined ? {} : { loadKg: i.dose.weightKg }),
      restAfter: i.dose.offS ?? 0,
    })),
  };
}

/** Rough seconds a variation takes, timed as the hang timer would run each item. */
export const itemsSeconds = (items: readonly Item[]): number =>
  items.reduce((sum, i) => sum + totalSeconds(doseProtocol(i.exercise, i.dose)), 0);

/**
 * Seconds one hangboard item takes: sets × hangs × (hang time + rest time) + sets × set rest.
 * A ground pull has no hang time, so each lift counts as SECONDS_PER_LIFT.
 */
export function hangItemSeconds(dose: Dose): number {
  const p = doseProtocol("", dose);
  const work = p.kind === "hang" ? p.hangS : SECONDS_PER_LIFT;
  return p.sets * p.reps * (work + p.restS) + p.sets * p.setRestS;
}

/** Seconds a hangboard variation takes: every item, with the rest between exercises between them. */
export const hangboardSeconds = (items: readonly Item[], exerciseRestS: number): number =>
  items.reduce((sum, i) => sum + hangItemSeconds(i.dose), 0) +
  Math.max(0, items.length - 1) * exerciseRestS;

/** Every set of every item done as prescribed. */
export function doneAsPrescribed(items: readonly Item[]): ItemDone[] {
  return items.map(({ exercise, dose: { sets, ...set } }, item) => ({
    item,
    exercise,
    sets: Array.from({ length: sets }, () => ({ ...set })),
  }));
}
