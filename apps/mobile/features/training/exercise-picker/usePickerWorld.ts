import type { PickerWorld } from "@sendtally/features/exercises";
import { useExerciseSeries, useExercises } from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";

/** Everything the exercise library offers, with how often each was logged. */
export function usePickerWorld(inWorkout: readonly string[], fingers: boolean): PickerWorld {
  const api = useApi();
  const { model } = useHangData();
  const exercises = useExercises(api).state;
  const series = useExerciseSeries(api);
  const uses = new Map<string, number>();
  if (series.status === "ready") for (const s of series.data) uses.set(s.key, s.sessions.length);
  for (const s of model.sessions) uses.set(s.gripId, (uses.get(s.gripId) ?? 0) + 1);
  return {
    mine: exercises.status === "ready" ? exercises.data : [],
    grips: model.grips.filter((g) => !g.hidden),
    uses,
    inWorkout,
    fingers,
  };
}
