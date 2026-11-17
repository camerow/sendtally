import { addDays, daysBetween, weekStart } from "./calendar";
import {
  blockWeekOn,
  isDated,
  occursOn,
  type Block,
  type Membership,
  type MembershipDays,
  type PlanChange,
  type WorkoutKind,
} from "./plan";
import type { CalendarDate } from "./types";

/** What of a plan decides which days its workouts land on. */
export type PlanDays = {
  blocks: readonly Block[];
  memberships: readonly Membership[];
  membershipDays: readonly MembershipDays[];
  planChanges: readonly PlanChange[];
};

/** A session logged anywhere, as the plan reads it. */
export type LoggedSession = {
  kind: WorkoutKind;
  date: CalendarDate;
  /** The workout it ran, when it names one; else the plan's says which. */
  workoutId: string | null;
  membershipId: string | null;
};

export const blockOfMembership = (
  plan: Pick<PlanDays, "blocks">,
  m: Pick<Membership, "blockId">
): Block | null =>
  m.blockId === null ? null : (plan.blocks.find((b) => b.id === m.blockId) ?? null);

/**
 * A membership as it plans a day: inside a block, the weekdays of the latest edit made at or
 * before that day's week; else as saved.
 */
export function asOn(
  plan: Pick<PlanDays, "membershipDays">,
  m: Membership,
  block: Block | null,
  d: CalendarDate
): Membership {
  const week = block === null ? null : blockWeekOn(block, d);
  if (week === null) return m;
  const edit = plan.membershipDays
    .filter((x) => x.membershipId === m.id && x.fromWeek <= week)
    .sort((a, b) => a.fromWeek - b.fromWeek)
    .at(-1);
  return { ...m, weekdays: edit === undefined ? m.weekdays : edit.weekdays };
}

/** The skip or move made on the day a membership was planned. */
export const changeOn = (
  plan: Pick<PlanDays, "planChanges">,
  m: Membership,
  d: CalendarDate
): PlanChange | null =>
  plan.planChanges.find((c) => c.membershipId === m.id && c.plannedOn === d) ?? null;

/** Landing on a day as planned and left alone, or moved there from another day. */
export const lands = (
  plan: PlanDays,
  m: Membership,
  block: Block | null,
  d: CalendarDate
): boolean =>
  (occursOn(asOn(plan, m, block, d), block, d) && changeOn(plan, m, d) === null) ||
  plan.planChanges.some((c) => c.membershipId === m.id && c.kind === "move" && c.movedTo === d);

/**
 * Logged against the membership that day, or, logged on its own, a session of the
 * workout's kind that day: a climbing session done on a climbing day counts.
 */
export function doneBy(
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

/** The days of the week a log falls in: its Block's week, or outside a Block its calendar week. */
function weekOf(block: Block | null, d: CalendarDate): CalendarDate[] {
  const seven = (from: CalendarDate): CalendarDate[] =>
    Array.from({ length: 7 }, (_, i) => addDays(from, i));
  if (block === null) return seven(weekStart(d));
  if (!isDated(block)) return [];
  const week = blockWeekOn(block, d);
  return week === null ? [] : seven(addDays(block.start, (week - 1) * 7));
}

/**
 * A planned workout done on another day of its week moves there, done: each log that names the
 * membership (or, naming none, its workout) on a day it does not land claims the nearest
 * occurrence that week not done, not changed by hand and not claimed already, earlier on a tie.
 * Derived on every read, so deleting or re-dating the log puts the plan back.
 */
export function claimedMoves(
  plan: PlanDays,
  kindOf: (workoutId: string) => WorkoutKind | undefined,
  logged: readonly LoggedSession[]
): PlanChange[] {
  const moves: PlanChange[] = [];
  const claimed = (m: Membership, d: CalendarDate): boolean =>
    moves.some((c) => c.membershipId === m.id && c.plannedOn === d);
  for (const log of [...logged].sort((a, b) => a.date.localeCompare(b.date))) {
    const countedThere = plan.memberships.some((m) => {
      const on =
        lands(plan, m, blockOfMembership(plan, m), log.date) ||
        moves.some((c) => c.membershipId === m.id && c.movedTo === log.date);
      return (
        on &&
        (log.membershipId === m.id ||
          (log.membershipId === null && log.kind === kindOf(m.workoutId)))
      );
    });
    if (countedThere) continue;
    const owners = plan.memberships.filter((m) =>
      log.membershipId === null
        ? log.workoutId !== null && m.workoutId === log.workoutId
        : m.id === log.membershipId
    );
    const open = owners.flatMap((m) => {
      const block = blockOfMembership(plan, m);
      if (m.blockId !== null && block === null) return [];
      const kind = kindOf(m.workoutId);
      return weekOf(block, log.date)
        .filter(
          (d) =>
            d !== log.date &&
            occursOn(asOn(plan, m, block, d), block, d) &&
            changeOn(plan, m, d) === null &&
            !claimed(m, d) &&
            doneBy(m, kind, logged, d) === undefined
        )
        .map((d) => ({ m, d }));
    });
    const apart = (d: CalendarDate): number => Math.abs(daysBetween(d, log.date));
    const [nearest] = open.sort((a, b) => apart(a.d) - apart(b.d) || a.d.localeCompare(b.d));
    if (nearest !== undefined)
      moves.push({
        membershipId: nearest.m.id,
        plannedOn: nearest.d,
        kind: "move",
        movedTo: log.date,
        reason: null,
        note: null,
      });
  }
  return moves;
}

/** The plan with the moves its logs claim laid over the ones made by hand. */
export const withClaimedMoves = <P extends PlanDays>(
  plan: P,
  kindOf: (workoutId: string) => WorkoutKind | undefined,
  logged: readonly LoggedSession[]
): P => ({ ...plan, planChanges: [...plan.planChanges, ...claimedMoves(plan, kindOf, logged)] });
