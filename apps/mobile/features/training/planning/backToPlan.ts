import { router } from "expo-router";
import type { CalendarDate } from "@sendtally/core/hang";

/**
 * Back from adding to the plan: on its block, with what was just planned lit for a
 * moment, or outside a block on Today at the day it starts.
 */
export function backToPlan(blockId: string | null, date: CalendarDate, highlight: string): void {
  if (blockId !== null)
    router.dismissTo({ pathname: "/plan/block/[id]", params: { id: blockId, highlight } });
  else router.dismissTo({ pathname: "/(tabs)/today", params: { date, at: String(Date.now()) } });
}
