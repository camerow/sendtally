import type { Plan } from "@sendtally/api-client";
import {
  blockEnd,
  isDated,
  type Block,
  type CalendarDate,
  type DatedBlock,
  type Membership,
} from "@sendtally/core/hang";

/** The block's workouts in its order. */
export const blockMembers = (plan: Plan, block: Pick<Block, "id">): Membership[] =>
  plan.memberships.filter((m) => m.blockId === block.id).sort(byPosition);

export const byPosition = (
  a: Pick<Membership, "position">,
  b: Pick<Membership, "position">
): number => a.position - b.position;

/** Where a workout added to the block goes: after the rest. */
export const nextPosition = (plan: Plan, blockId: string | null): number =>
  blockId === null
    ? 0
    : Math.max(
        -1,
        ...plan.memberships.filter((m) => m.blockId === blockId).map((m) => m.position)
      ) + 1;

/**
 * Blocks running today, then those still to start (soonest first), then templates with no
 * dates (by name), then those over (latest first).
 */
export type BlockGroups = {
  current: DatedBlock[];
  upcoming: DatedBlock[];
  templates: Block[];
  past: DatedBlock[];
};

export function blockGroups(blocks: readonly Block[], today: CalendarDate): BlockGroups {
  const byStart = blocks.filter(isDated).sort((a, b) => a.start.localeCompare(b.start));
  return {
    templates: blocks.filter((b) => !isDated(b)).sort((a, b) => a.name.localeCompare(b.name)),
    current: byStart.filter((b) => b.start <= today && today < blockEnd(b)),
    upcoming: byStart.filter((b) => b.start > today),
    past: byStart.filter((b) => blockEnd(b) <= today).reverse(),
  };
}
