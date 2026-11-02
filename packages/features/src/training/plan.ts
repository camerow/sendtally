import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockWeekOn,
  focusOf,
  occursOn,
  prescription,
  type Block,
  type CalendarDate,
  type Membership,
  type PlanChange,
  type PlanLink,
  type SessionItem,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { workoutUsage } from "../workouts/library";
import { daysInWeek, scheduleOf } from "./weekDays";

/**
 * Past and not done is missed; today and later, not done yet, is planned. A day skipped
 * counts as neither, and a day moved away is planned where it landed instead.
 */
export type OccurrenceStatus = "done" | "missed" | "planned" | "skipped" | "moved";

/** A session logged anywhere, as the plan reads it. */
export type LoggedSession = {
  kind: WorkoutKind;
  date: CalendarDate;
  /** The workout it ran, when it names one; else the plan's says which. */
  workoutId: string | null;
  membershipId: string | null;
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
  /** How many sessions of the workout come before this one: which dose each item takes. */
  session: number;
  /** The items as this session runs them, with the week's changes laid over them. */
  items: SessionItem[];
  status: OccurrenceStatus;
  /** The skip or move made on this day as planned. */
  change: PlanChange | null;
  /** Moved here: the day it was planned on, whose week's load it keeps. */
  movedFrom: CalendarDate | null;
};

export type WorkoutLookup = (id: string) => Workout | undefined;

/** The plan a run of the occurrence logs against, and the focus it records. */
export const occurrenceLink = (o: Occurrence): PlanLink => ({
  membershipId: o.membership.id,
  week: o.week,
  focus: focusOf(o.workout),
});

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

/**
 * A membership as it plans a day: inside a block, the weekdays of the latest edit made at or
 * before that day's week; else as saved.
 */
export function asOn(
  plan: Pick<Plan, "membershipDays">,
  m: Membership,
  block: Block | null,
  d: CalendarDate
): Membership {
  const week = block === null ? null : blockWeekOn(block, d);
  if (week === null) return m;
  return { ...m, weekdays: daysInWeek(scheduleOf(plan, m), week) };
}

/** The skip or move made on the day a membership was planned. */
const changeOn = (plan: Plan, m: Membership, d: CalendarDate): PlanChange | null =>
  plan.planChanges.find((c) => c.membershipId === m.id && c.plannedOn === d) ?? null;

/** Landing on a day as planned and left alone, or moved there from another day. */
const lands = (plan: Plan, m: Membership, block: Block | null, d: CalendarDate): boolean =>
  (occursOn(asOn(plan, m, block, d), block, d) && changeOn(plan, m, d) === null) ||
  plan.planChanges.some((c) => c.membershipId === m.id && c.kind === "move" && c.movedTo === d);

/** How many sessions of the workout were logged before a date, or in all without one. */
export const sessionsOf = (
  plan: Pick<Plan, "memberships">,
  workoutId: string,
  logged: readonly LoggedSession[],
  before?: CalendarDate
): number =>
  workoutUsage(
    before === undefined ? logged : logged.filter((s) => s.date < before),
    plan.memberships
  ).get(workoutId)?.count ?? 0;

function occurrence(
  plan: Plan,
  m: Membership,
  workout: Workout | undefined,
  logged: readonly LoggedSession[],
  date: CalendarDate,
  today: CalendarDate,
  movedFrom: CalendarDate | null = null
): Occurrence {
  const block = blockOfMembership(plan, m);
  const week = block === null ? null : blockWeekOn(block, movedFrom ?? date);
  const change = movedFrom === null ? changeOn(plan, m, date) : null;
  const done = doneBy(m, workout?.kind, logged, date);
  let session = sessionsOf(plan, m.workoutId, logged, date);
  if (done === undefined && date >= today) {
    // The next session follows every one logged; each open day before this one takes one more.
    session = sessionsOf(plan, m.workoutId, logged);
    for (let d = today; d < date; d = addDays(d, 1))
      if (lands(plan, m, block, d) && doneBy(m, workout?.kind, logged, d) === undefined) session++;
  }
  return {
    membership: m,
    workout,
    block,
    date,
    week,
    session,
    items:
      workout === undefined
        ? []
        : prescription(plan.weekChanges, { workout, membershipId: m.id, session, week }),
    status:
      change?.kind === "skip"
        ? "skipped"
        : change?.kind === "move"
          ? "moved"
          : done !== undefined
            ? "done"
            : date < today
              ? "missed"
              : "planned",
    change,
    movedFrom,
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
  const planned = plan.memberships
    .filter((m) => {
      const block = blockOfMembership(plan, m);
      return (
        (m.blockId === null || block !== null) && occursOn(asOn(plan, m, block, date), block, date)
      );
    })
    .map((m) => occurrence(plan, m, workout(m.workoutId), logged, date, today));
  const movedIn = plan.planChanges.flatMap((c) => {
    const m = plan.memberships.find((x) => x.id === c.membershipId);
    return c.kind === "move" && c.movedTo === date && m !== undefined
      ? [occurrence(plan, m, workout(m.workoutId), logged, date, today, c.plannedOn)]
      : [];
  });
  return [...planned, ...movedIn];
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
    if (!lands(plan, m, block, d)) continue;
    const o = occurrencesOn(plan, workout, logged, d, today).find(
      (x) => x.membership.id === m.id && x.status === "planned"
    );
    if (o !== undefined) return o;
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
    planChanges: plan.planChanges.filter((c) => !gone.has(c.membershipId)),
    membershipDays: plan.membershipDays.filter((c) => !gone.has(c.membershipId)),
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
