import type { Plan } from "@sendtally/api-client";
import type { Block, Membership } from "@sendtally/core/hang";

export const blockMembers = (plan: Plan, block: Pick<Block, "id">): Membership[] =>
  plan.memberships.filter((m) => m.blockId === block.id);
