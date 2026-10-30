import { router } from "expo-router";
import type { Membership } from "@sendtally/core/hang";

/** Its weeks inside a block, its workout outside one. `back` names the screen it opens from. */
export function openMembership(
  m: Pick<Membership, "id" | "blockId" | "workoutId">,
  back?: string
): void {
  if (m.blockId === null) router.push({ pathname: "/workout/[id]", params: { id: m.workoutId } });
  else
    router.push({
      pathname: "/plan/membership/[id]",
      params: back === undefined ? { id: m.id } : { id: m.id, back },
    });
}
