import { useQuery, type FetchStatus } from "@tanstack/react-query";
import type { ConnectionStatus, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";

/**
 * Whether first run shows: the cached or fetched status says so. Null only while the very first
 * fetch of an account with nothing cached is in flight; a failed or paused fetch reads as not
 * showing, as does a server without the field, so the app never waits on it.
 */
export function firstRunShows(
  data: Pick<ConnectionStatus, "firstRun"> | undefined,
  fetchStatus: FetchStatus
): boolean | null {
  if (data !== undefined) return data.firstRun === true;
  return fetchStatus === "fetching" ? null : false;
}

/** First run's gate, for the app shell. */
export function useFirstRun(api: SendtallyApi): boolean | null {
  const { data, fetchStatus } = useQuery(queries.status(api));
  return firstRunShows(data, fetchStatus);
}
