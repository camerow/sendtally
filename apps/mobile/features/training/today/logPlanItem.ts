import { router } from "expo-router";
import type { PlanItem } from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";

/** Opens the form that logs a plan item: the session form for climbing, the activity form otherwise. */
export function logPlanItem(item: PlanItem, date: CalendarDate): void {
  if (item.kind === "climb") router.push("/session/new");
  else
    router.push({
      pathname: "/activity/new",
      params: {
        kind: item.kind,
        title: item.title,
        date,
        planItemId: item.id,
        ...(item.minutes === null ? {} : { minutes: String(item.minutes) }),
      },
    });
}
