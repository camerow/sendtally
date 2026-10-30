import { router } from "expo-router";
import type { Membership } from "@sendtally/core/hang";

/** Its weeks inside a block, its workout outside one. */
export function openMembership(m: Pick<Membership, "id" | "blockId" | "workoutId">): void {
  if (m.blockId === null) router.push({ pathname: "/workout/[id]", params: { id: m.workoutId } });
  else router.push({ pathname: "/plan/membership/[id]", params: { id: m.id } });
}
