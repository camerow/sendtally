import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import React from "react";
import type { Activity, PlanItem, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";

export type ActivityActions = {
  saveActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  savePlanItem: (item: PlanItem) => Promise<void>;
  deletePlanItem: (id: string) => Promise<void>;
  setPlanItemSkip: (id: string, date: string, skipped: boolean) => Promise<void>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [item, ...list];

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
    const plan = queries.planItems(api).queryKey;
    const skipped = (item: PlanItem, date: string, skip: boolean): PlanItem => ({
      ...item,
      skip: skip ? [...new Set([...item.skip, date])].sort() : item.skip.filter((d) => d !== date),
    });

    return {
      saveActivity: (activity) =>
        write<Activity[]>(
          activities,
          (list) => upsert(list, activity).sort(byNewest),
          () => {
            const { id, ...input } = activity;
            return api.saveActivity(id, input);
          }
        ),
      deleteActivity: (id) =>
        write<Activity[]>(
          activities,
          (list) => list.filter((a) => a.id !== id),
          () => api.deleteActivity(id)
        ),
      savePlanItem: (item) =>
        write<PlanItem[]>(
          plan,
          (list) => upsert(list, item),
          () => api.savePlanItem(item)
        ),
      deletePlanItem: (id) =>
        write<PlanItem[]>(
          plan,
          (list) => list.filter((p) => p.id !== id),
          () => api.deletePlanItem(id)
        ),
      setPlanItemSkip: (id, date, skip) =>
        write<PlanItem[]>(
          plan,
          (list) => list.map((p) => (p.id === id ? skipped(p, date, skip) : p)),
          () => api.skipPlanItem(id, date, skip)
        ),
    };
  }, [api, client, onError]);
}
