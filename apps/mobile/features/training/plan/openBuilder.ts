import { router } from "expo-router";
import type { CalendarDate, Weekday } from "@sendtally/core/hang";

/** The workout builder, set to hand its new workout straight to the planner. */
export function openBuilderToPlan(plan: {
  days: readonly Weekday[];
  start: CalendarDate;
  blockId?: string;
}): void {
  router.push({
    pathname: "/workout/builder",
    params: {
      plan: "1",
      start: plan.start,
      days: plan.days.join(","),
      ...(plan.blockId === undefined ? {} : { block: plan.blockId }),
    },
  });
}
