import type { ActivityRecord, PlanItem, SendtallyApi, TrainingBlock } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The newest 1000 activities, newest first. */
export function useActivities(api: SendtallyApi): Query<ActivityRecord[]> {
  return useQuery(queries.activities(api));
}

export function useTrainingBlocks(api: SendtallyApi): Query<TrainingBlock[]> {
  return useQuery(queries.trainingBlocks(api));
}

export function usePlanItems(api: SendtallyApi): Query<PlanItem[]> {
  return useQuery(queries.planItems(api));
}
