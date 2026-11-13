import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";

export type ExerciseActions = {
  /** Deleted when nothing uses it, else archived; false when the server refused. */
  remove: (id: string) => Promise<boolean>;
  /** Every workout and log entry naming `from` names `into` after. */
  merge: (from: Exercise, into: Exercise) => Promise<boolean>;
  /** Reads the exercises and the workouts naming them again, after one was saved. */
  refresh: () => Promise<void>;
};

/** Removing and merging exercises, refreshing everything that names them once done. */
export function useExerciseActions(
  api: SendtallyApi,
  onError: (error: unknown) => void
): ExerciseActions {
  const client = useQueryClient();
  return React.useMemo((): ExerciseActions => {
    const run = async (request: () => Promise<unknown>, touched: readonly unknown[][]) => {
      try {
        await request();
        return true;
      } catch (error) {
        onError(error);
        return false;
      } finally {
        await Promise.all(touched.map((queryKey) => client.invalidateQueries({ queryKey })));
      }
    };
    const exercises = queries.exercises(api).queryKey as unknown[];
    return {
      remove: (id) => run(() => api.removeExercise(id), [exercises]),
      merge: (from, into) =>
        run(
          () => api.mergeExercise(from.id, into.id),
          [
            exercises,
            queries.workouts(api).queryKey as unknown[],
            queries.activities(api).queryKey as unknown[],
          ]
        ),
      refresh: async () => {
        await client.invalidateQueries({ queryKey: exercises });
        await client.invalidateQueries({ queryKey: queries.workouts(api).queryKey as unknown[] });
      },
    };
  }, [api, client, onError]);
}
