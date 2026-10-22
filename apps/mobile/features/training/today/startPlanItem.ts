import type { PlanItem, PlanTemplate } from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";
import { startIntervals } from "../intervals/intervalsParams";

/** Runs a plan item's intervals in the timer, or null for a plan item without them. `body` is its workout's or its own. */
export function startPlanItem(
  item: PlanItem,
  body: PlanTemplate | null,
  date: CalendarDate
): (() => void) | null {
  if (item.kind === "climb" || body?.kind !== "intervals") return null;
  const { kind, title, id } = item;
  const workoutId = item.workoutId ?? null;
  return () =>
    startIntervals({ kind, title, date, planItemId: id, activityId: null, workoutId, body });
}
