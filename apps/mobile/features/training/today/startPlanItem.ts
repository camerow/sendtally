import type { PlanItem } from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";
import { startIntervals } from "../intervals/intervalsParams";

/** Runs a plan item's intervals in the timer, or null for a plan item without them. */
export function startPlanItem(item: PlanItem, date: CalendarDate): (() => void) | null {
  const body = item.template;
  if (item.kind === "climb" || body?.kind !== "intervals") return null;
  const { kind, title, id } = item;
  return () => startIntervals({ kind, title, date, planItemId: id, activityId: null, body });
}
