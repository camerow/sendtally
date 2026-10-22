import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { PlanItem, SendtallyApi, UserWorkout } from "@sendtally/api-client";
import { queries } from "../query";
import type { WorkoutDraft } from "./types";

export type WorkoutActions = {
  saveWorkout: (id: string, workout: WorkoutDraft) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
};

/**
 * Writes apply to the cache at once and go to the server behind it. A failed
 * write refetches and is reported through `onError`; the promises never reject.
 */
export function useWorkoutActions(
  api: SendtallyApi,
  onError: (error: unknown) => void
): WorkoutActions {
  const client = useQueryClient();
  return React.useMemo((): WorkoutActions => {
    const key = queries.workouts(api).queryKey;
    const plan = queries.planItems(api).queryKey;
    const write = async (
      patch: (list: UserWorkout[]) => UserWorkout[],
      request: () => Promise<unknown>
    ): Promise<void> => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<UserWorkout[]>(key, (list) => (list === undefined ? list : patch(list)));
      try {
        await request();
      } catch (error) {
        onError(error);
        await client.invalidateQueries({ queryKey: key });
      }
    };
    return {
      saveWorkout: (id, workout) =>
        write(
          (list) => {
            const saved = { ...workout, id, updatedAt: new Date().toISOString() };
            return list.some((w) => w.id === id)
              ? list.map((w) => (w.id === id ? saved : w))
              : [...list, saved];
          },
          () => api.saveWorkout(id, workout)
        ),
      deleteWorkout: (id) => {
        client.setQueryData<PlanItem[]>(plan, (items) =>
          items?.map((p) => (p.workoutId === id ? { ...p, workoutId: null } : p))
        );
        return write(
          (list) => list.filter((w) => w.id !== id),
          () => api.deleteWorkout(id)
        );
      },
    };
  }, [api, client, onError]);
}
