import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import React from "react";
import type {
  Activity,
  ActivityRecord,
  ConnectionStatus,
  SendtallyApi,
} from "@sendtally/api-client";
import { queries } from "../query";

export type ActivityActions = {
  saveActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [item, ...list];

// A new activity shows as posting when the server is about to post it, so the
// screen polls for the outcome instead of offering a second post meanwhile.
const record = (
  activity: Activity,
  previous: ActivityRecord | undefined,
  status: ConnectionStatus | undefined
): ActivityRecord => ({
  stravaActivityId: null,
  postedAt: null,
  postState: status?.strava?.status === "active" && status.strava.postTraining ? "pending" : null,
  postError: null,
  ...previous,
  ...activity,
});

const byNewest = (a: Activity, b: Activity): number =>
  b.date.localeCompare(a.date) || (b.startTime ?? "").localeCompare(a.startTime ?? "");

// ponytail: one chain for every training write, as in useHangActions, so quick
// taps reach the server in the order they were made.
let chain: Promise<unknown> = Promise.resolve();

/**
 * Writes apply to the cache at once and go to the server in order behind it.
 * A failed write refetches, so the screen falls back to what the server holds,
 * and is reported through `onError`; the returned promises never reject.
 */
export function useActivityActions(
  api: SendtallyApi,
  onError: (error: unknown) => void
): ActivityActions {
  const client = useQueryClient();

  return React.useMemo((): ActivityActions => {
    const write = async <T>(
      key: QueryKey,
      patch: (data: T) => T,
      request: () => Promise<unknown>
    ): Promise<void> => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<T>(key, (data) => (data === undefined ? data : patch(data)));
      const next = chain.then(request);
      chain = next.catch(() => undefined);
      try {
        await next;
      } catch (error) {
        onError(error);
        await client.invalidateQueries({ queryKey: key });
      }
    };
    const activities = queries.activities(api).queryKey;

    return {
      saveActivity: (activity) =>
        write<ActivityRecord[]>(
          activities,
          (list) => {
            const previous = list.find((a) => a.id === activity.id);
            const status = client.getQueryData(queries.status(api).queryKey);
            return upsert(list, record(activity, previous, status)).sort(byNewest);
          },
          () => {
            const { id, ...input } = activity;
            return api.saveActivity(id, input);
          }
        ),
      deleteActivity: (id) =>
        write<ActivityRecord[]>(
          activities,
          (list) => list.filter((a) => a.id !== id),
          () => api.deleteActivity(id)
        ),
    };
  }, [api, client, onError]);
}
