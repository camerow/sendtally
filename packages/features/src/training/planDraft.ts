import type { Plan } from "@sendtally/api-client";
import type { Block, Membership, WeekChange } from "@sendtally/core/hang";
import { blockMembers } from "./blocks";
import { scheduleOf, type DaySchedule } from "./weekDays";

/** Edits held until Save: the block as typed, days as tapped, load as set, workouts as ordered. */
export type PlanDraft = {
  block: Block | null;
  schedules: readonly DaySchedule[];
  weekChanges: readonly WeekChange[];
  /** Membership ids in their new order; none while the order is untouched. */
  order: readonly string[];
};

export const emptyDraft: PlanDraft = { block: null, schedules: [], weekChanges: [], order: [] };

/** The plan with memberships placed as `order` lists them. */
const withOrder = (plan: Plan, order: readonly string[]): Plan => ({
  ...plan,
  memberships: plan.memberships.map((m) => {
    const position = order.indexOf(m.id);
    return position === -1 ? m : { ...m, position };
  }),
});

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

const sameRung = (a: WeekChange, b: WeekChange): boolean =>
  a.membershipId === b.membershipId &&
  a.week === b.week &&
  a.dose === b.dose &&
  a.itemId === b.itemId;

/** The plan with a week's load change; an empty one puts the item back as written. */
export function withChange(plan: Plan, change: WeekChange): Plan {
  const rest = plan.weekChanges.filter((c) => !sameRung(c, change));
  const empty = Object.keys(change.change).length === 0;
  return { ...plan, weekChanges: empty ? rest : [...rest, change] };
}

/** The plan with a membership's days replaced. */
export const withSchedule = (plan: Plan, next: DaySchedule): Plan => ({
  ...plan,
  memberships: plan.memberships.map((x) =>
    x.id === next.membershipId ? { ...x, weekdays: next.weekdays } : x
  ),
  membershipDays: [
    ...plan.membershipDays.filter((d) => d.membershipId !== next.membershipId),
    ...next.weeks,
  ],
});

/** The plans that start with a block, which move when its first day does. */
export function movedWith(plan: Plan, block: Block): Membership[] {
  const was = plan.blocks.find((b) => b.id === block.id);
  if (was === undefined || was.start === null || block.start === null || was.start === block.start)
    return [];
  const start = block.start;
  return plan.memberships
    .filter((m) => m.blockId === block.id && m.start === was.start)
    .map((m) => ({ ...m, start }));
}

/** The plan as the draft would leave it. */
export function applyDraft(plan: Plan, draft: PlanDraft): Plan {
  const next = withOrder(
    draft.weekChanges.reduce(withChange, draft.schedules.reduce(withSchedule, plan)),
    draft.order
  );
  const { block } = draft;
  if (block === null) return next;
  const moved = new Set(movedWith(plan, block).map((m) => m.id));
  return {
    ...next,
    blocks: upsert(next.blocks, block),
    memberships: next.memberships.map((m) =>
      moved.has(m.id) ? { ...m, start: block.start ?? m.start } : m
    ),
  };
}

/** The draft with a membership's days as tapped. */
export const draftSchedule = (draft: PlanDraft, schedule: DaySchedule): PlanDraft => ({
  ...draft,
  schedules: [...draft.schedules.filter((s) => s.membershipId !== schedule.membershipId), schedule],
});

/** The draft with a week's load as set. */
export const draftChange = (draft: PlanDraft, change: WeekChange): PlanDraft => ({
  ...draft,
  weekChanges: [...draft.weekChanges.filter((c) => !sameRung(c, change)), change],
});

/** The draft with one of the block's workouts moved `by` places, as the plan shows it now. */
export function draftMove(
  draft: PlanDraft,
  plan: Plan,
  block: Pick<Block, "id">,
  membershipId: string,
  by: -1 | 1
): PlanDraft {
  const ids = blockMembers(applyDraft(plan, draft), block).map((m) => m.id);
  const from = ids.indexOf(membershipId);
  const to = from + by;
  if (from === -1 || to < 0 || to >= ids.length) return draft;
  [ids[from], ids[to]] = [ids[to] as string, ids[from] as string];
  return { ...draft, order: ids };
}

/** The memberships the draft moves to another first day or place, as it leaves them. */
export function movedMemberships(plan: Plan, draft: PlanDraft): Membership[] {
  return applyDraft(plan, draft).memberships.filter((m) => {
    const was = plan.memberships.find((x) => x.id === m.id);
    return was !== undefined && (was.start !== m.start || was.position !== m.position);
  });
}

/** The schedules the draft actually changes from the plan. */
export function changedSchedules(plan: Plan, draft: PlanDraft): DaySchedule[] {
  const key = (s: DaySchedule): string =>
    JSON.stringify([[...s.weekdays].sort(), s.weeks.map((w) => [w.fromWeek, w.weekdays])]);
  return draft.schedules.filter((s) => {
    const m = plan.memberships.find((x) => x.id === s.membershipId);
    return m !== undefined && key(scheduleOf(plan, m)) !== key(s);
  });
}
