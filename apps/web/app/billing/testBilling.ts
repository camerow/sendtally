import { QueryClient } from "@tanstack/react-query";
import type { Entitlements, Plan, SendtallyApi, WorkoutRecord } from "@sendtally/api-client";
import { TEST_LIBRARY } from "@sendtally/features/library/testing";
import { queries } from "@sendtally/features/query";
import { hangData } from "../training/data/testHang";

export { ENTITLEMENTS } from "@sendtally/features/billing/testing";

const EMPTY_PLAN: Plan = {
  blocks: [],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

/** An API whose every call hangs, so a test reads only what its client was seeded with. */
export const hangingApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
) as SendtallyApi;

/** A query client holding an account's entitlements and training, as a loaded app would. */
export function seededClient(
  entitlements: Entitlements,
  { plan = EMPTY_PLAN, workouts = [] }: { plan?: Plan; workouts?: WorkoutRecord[] } = {}
): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  });
  const seed: [readonly unknown[], unknown][] = [
    [queries.entitlements(hangingApi).queryKey, entitlements],
    [queries.hang(hangingApi).queryKey, hangData()],
    [queries.plan(hangingApi).queryKey, plan],
    [queries.workouts(hangingApi).queryKey, workouts],
    [queries.exercises(hangingApi).queryKey, []],
    [queries.library(hangingApi).queryKey, TEST_LIBRARY],
  ];
  seed.forEach(([key, data]) => client.setQueryData(key, data));
  return client;
}
