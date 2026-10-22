import type { Activity, PlanItem, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The newest 1000 activities, newest first. */
export function useActivities(api: SendtallyApi): Query<Activity[]> {
  return useQuery(queries.activities(api));
}

export function usePlanItems(api: SendtallyApi): Query<PlanItem[]> {
  return useQuery(queries.planItems(api));
}
