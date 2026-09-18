import { queryOptions, type QueryKey } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";

/** One row is cheap to fetch again and is only worth keeping while its screen is near. */
const ROW_GC_TIME = 5 * 60 * 1000;

/** A Strava post runs after the log response, so a pending row is re-read until it settles. */
const POST_POLL_INTERVAL = 3000;

/** One key per endpoint, so every screen reading the same data shares one cache entry and one request. */
export const queries = {
  status: (api: SendtallyApi) =>
    queryOptions({ queryKey: ["status"], queryFn: () => api.status() }),
  entitlements: (api: SendtallyApi) =>
    queryOptions({ queryKey: ["entitlements"], queryFn: () => api.entitlements() }),
  sessions: (api: SendtallyApi) =>
    queryOptions({
      queryKey: ["sessions"],
      queryFn: async () => (await api.sessions()).sessions,
    }),
  sessionsWithClimbs: (api: SendtallyApi) =>
    queryOptions({
      queryKey: ["sessionsWithClimbs"],
      queryFn: async () => (await api.sessionsWithClimbs()).sessions,
    }),
  session: (api: SendtallyApi, fingerprint: string) =>
    queryOptions({
      queryKey: ["session", fingerprint],
      queryFn: async () => (await api.session(fingerprint)).session,
      gcTime: ROW_GC_TIME,
      refetchInterval: (query) =>
        query.state.data?.post_state === "pending" ? POST_POLL_INTERVAL : false,
    }),
  entries: (api: SendtallyApi) =>
    queryOptions({ queryKey: ["entries"], queryFn: async () => (await api.entries()).entries }),
  entry: (api: SendtallyApi, id: string) =>
    queryOptions({
      queryKey: ["entry", id],
      queryFn: async () => (await api.entry(id)).entry,
      gcTime: ROW_GC_TIME,
    }),
  climbs: (api: SendtallyApi) =>
    queryOptions({ queryKey: ["climbs"], queryFn: async () => (await api.climbs()).climbs }),
  gyms: (api: SendtallyApi) =>
    queryOptions({ queryKey: ["gyms"], queryFn: async () => (await api.gyms()).gyms }),
  area: (api: SendtallyApi, slug: string) =>
    queryOptions({
      queryKey: ["area", slug],
      queryFn: () => api.area(slug),
      gcTime: ROW_GC_TIME,
    }),
  areaClimb: (api: SendtallyApi, slug: string) =>
    queryOptions({
      queryKey: ["areaClimb", slug],
      queryFn: () => api.areaClimb(slug),
      gcTime: ROW_GC_TIME,
    }),
  tags: (api: SendtallyApi) =>
    queryOptions({ queryKey: ["tags"], queryFn: async () => (await api.tags()).tags }),
};

const NOT_PERSISTED: readonly unknown[] = ["session", "entry", "entitlements", "area", "areaClimb"];

/**
 * Lists are what a cold start opens on; single rows are neither needed then nor bounded in number,
 * and a restored entitlement would unlock member UI after the subscription lapsed.
 */
export function worthPersisting(queryKey: QueryKey): boolean {
  return !NOT_PERSISTED.includes(queryKey[0]);
}
