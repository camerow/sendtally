import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockEnd,
  type Block,
  type CalendarDate,
  type Membership,
} from "@sendtally/core/hang";
import { trainingDay, type TrainingLog } from "./days";

export const blockMembers = (plan: Plan, block: Pick<Block, "id">): Membership[] =>
  plan.memberships.filter((m) => m.blockId === block.id);

/** Blocks running today, then those still to start (soonest first), then those over (latest first). */
export type BlockGroups = { current: Block[]; upcoming: Block[]; past: Block[] };

export function blockGroups(blocks: readonly Block[], today: CalendarDate): BlockGroups {
  const byStart = [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  return {
    current: byStart.filter((b) => b.start <= today && today < blockEnd(b)),
    upcoming: byStart.filter((b) => b.start > today),
    past: byStart.filter((b) => blockEnd(b) <= today).reverse(),
  };
}

/** How many of the block's planned sessions were done, over all its days. */
export function blockDone(
  log: TrainingLog,
  block: Block,
  today: CalendarDate
): { done: number; planned: number } {
  const plans = Array.from({ length: block.weeks * 7 }, (_, i) =>
    trainingDay(log, addDays(block.start, i), today)
  ).flatMap((d) => d.plans.filter((p) => p.membership.blockId === block.id));
  return { done: plans.filter((p) => p.status === "done").length, planned: plans.length };
}
