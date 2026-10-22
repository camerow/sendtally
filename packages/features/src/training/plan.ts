import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockWeekOn,
  occursOn,
  prescription,
  upcomingVariations,
  variationTrail,
  type Block,
  type CalendarDate,
  type Item,
  type Membership,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";

/** Past and not done is missed; today and later, not done yet, is planned. */
export type OccurrenceStatus = "done" | "missed" | "planned";

/** A session logged anywhere, as the plan reads it. */
export type LoggedSession = {
  kind: WorkoutKind;
  date: CalendarDate;
  membershipId: string | null;
  variation: number | null;
};

/** One day a membership lands on: what it prescribes that day, and whether it happened. */
export type Occurrence = {
  membership: Membership;
  /** Undefined while the library is loading, or once the workout is gone. */
  workout: Workout | undefined;
  block: Block | null;
  date: CalendarDate;
  /** The block week, or null outside a block, which is always as written. */
  week: number | null;
  variation: number;
  /** The variation's items with the week's changes laid over them. */
  items: Item[];
  status: OccurrenceStatus;
};

export type WorkoutLookup = (id: string) => Workout | undefined;

export const blockOfMembership = (plan: Plan, m: Pick<Membership, "blockId">): Block | null =>
  m.blockId === null ? null : (plan.blocks.find((b) => b.id === m.blockId) ?? null);

/**
 * Logged against the membership that day, or, logged on its own, a session of the
 * workout's kind that day: a climbing session done on a climbing day counts.
 */
function doneBy(
  m: Membership,
  kind: WorkoutKind | undefined,
  logged: readonly LoggedSession[],
  date: CalendarDate
): LoggedSession | undefined {
  return logged.find(
    (s) =>
      s.date === date && (s.membershipId === m.id || (s.membershipId === null && s.kind === kind))
  );
}

function occurrence(
  plan: Plan,
  m: Membership,
  workout: Workout | undefined,
  logged: readonly LoggedSession[],
  date: CalendarDate,
  today: CalendarDate
): Occurrence {
  const block = blockOfMembership(plan, m);
  const week = block === null ? null : blockWeekOn(block, date);
  const done = doneBy(m, workout?.kind, logged, date);
  let variation = done?.variation ?? 0;
  if (done === undefined && workout !== undefined) {
    // The next session takes the next variation; each open day before this one takes one more.
    let ahead = 0;
    for (let d = today; d < date; d = addDays(d, 1))
      if (occursOn(m, block, d) && doneBy(m, workout.kind, logged, d) === undefined) ahead++;
    variation =
      upcomingVariations(workout.pattern, variationTrail(logged, m.id), ahead + 1)[ahead] ?? 0;
  }
  return {
    membership: m,
    workout,
    block,
    date,
    week,
    variation,
    items:
      workout === undefined
        ? []
        : prescription(plan.weekChanges, { workout, membershipId: m.id, variation, week }),
    status: done !== undefined ? "done" : date < today ? "missed" : "planned",
  };
}

/** Every membership landing on a date. */
export function occurrencesOn(
  plan: Plan,
  workout: WorkoutLookup,
  logged: readonly LoggedSession[],
  date: CalendarDate,
  today: CalendarDate
): Occurrence[] {
  return plan.memberships
    .filter((m) => {
      const block = blockOfMembership(plan, m);
      return (m.blockId === null || block !== null) && occursOn(m, block, date);
    })
    .map((m) => occurrence(plan, m, workout(m.workoutId), logged, date, today));
}

/** The membership's next session from `today`: its date and what it prescribes. */
export function nextOccurrence(
  plan: Plan,
  m: Membership,
  workout: WorkoutLookup,
  logged: readonly LoggedSession[],
  today: CalendarDate,
  horizonDays = 366
): Occurrence | null {
  const block = blockOfMembership(plan, m);
  if (m.blockId !== null && block === null) return null;
  for (let i = 0; i < horizonDays; i++) {
    const d = addDays(today, i);
    if (!occursOn(m, block, d)) continue;
    const o = occurrence(plan, m, workout(m.workoutId), logged, d, today);
    if (o.status === "planned") return o;
  }
  return null;
}

/** The plan without the memberships `drop` picks, nor their week changes. */
function without(plan: Plan, drop: (m: Membership) => boolean): Plan {
  const gone = new Set(plan.memberships.filter(drop).map((m) => m.id));
  return {
    blocks: plan.blocks,
    memberships: plan.memberships.filter((m) => !gone.has(m.id)),
    weekChanges: plan.weekChanges.filter((c) => !gone.has(c.membershipId)),
  };
}

/** A deleted workout leaves every block. */
export const withoutWorkout = (plan: Plan, workoutId: string): Plan =>
  without(plan, (m) => m.workoutId === workoutId);

/** A deleted block takes its memberships with it. */
export const withoutBlock = (plan: Plan, blockId: string): Plan => {
  const rest = without(plan, (m) => m.blockId === blockId);
  return { ...rest, blocks: rest.blocks.filter((b) => b.id !== blockId) };
};

export const withoutMembership = (plan: Plan, id: string): Plan =>
  without(plan, (m) => m.id === id);
