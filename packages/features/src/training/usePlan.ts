import type { Plan, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** Blocks, memberships and their week changes. */
export function usePlan(api: SendtallyApi): Query<Plan> {
  return useQuery(queries.plan(api));
}
