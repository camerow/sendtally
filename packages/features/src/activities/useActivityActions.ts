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
  /** True once the server holds it; false when it failed and the cache fell back. */
  saveActivity: (activity: Activity) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [item, ...list];

// A new activity shows as posting when the server is about to post it, so the
// screen polls for the outcome instead of offering a second post meanwhile.
// Its fingerboard part is no field of the activity; it lands with the hangboard data.
const record = (
  { fingerboard: _, ...activity }: Activity,
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
 * and is reported through `onError`; the returned promises never reject, and say whether the
 * server took the write.
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
    ): Promise<boolean> => {
      client.setQueryData<T>(key, (data) => (data === undefined ? data : patch(data)));
      await client.cancelQueries({ queryKey: key }, { revert: false });
      const next = chain.then(request);
      chain = next.catch(() => undefined);
      try {
        await next;
        return true;
      } catch (error) {
        onError(error);
        await client.invalidateQueries({ queryKey: key });
        return false;
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
          async () => {
            const { id, ...input } = activity;
            const saved = await api.saveActivity(id, input);
            // Its fingerboard part is read with the hangboard data and the log's sessions.
            if (input.fingerboard !== undefined)
              await Promise.all(
                [queries.hang(api), queries.sessions(api), queries.sessionsWithClimbs(api)].map(
                  (q) => client.invalidateQueries({ queryKey: q.queryKey })
                )
              );
            return saved;
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
