import type { Plan } from "@sendtally/api-client";
import { blockEnd, type Block, type CalendarDate, type Membership } from "@sendtally/core/hang";

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
