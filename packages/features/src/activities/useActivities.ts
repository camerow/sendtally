import type { ActivityRecord, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The newest 1000 activities, newest first. */
export function useActivities(api: SendtallyApi): Query<ActivityRecord[]> {
  return useQuery(queries.activities(api));
}
