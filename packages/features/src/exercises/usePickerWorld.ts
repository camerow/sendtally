import type { SendtallyApi } from "@sendtally/api-client";
import type { HangModel } from "../hang/model";
import { useExerciseSeries } from "../statistics/useExerciseSeries";
import { useExercises } from "../statistics/useExercises";
import type { PickerWorld } from "./picker";

/** Everything the exercise library offers, with how often each was logged. */
export function usePickerWorld(
  api: SendtallyApi,
  model: Pick<HangModel, "sessions" | "grips">,
  inWorkout: readonly string[],
  fingers: boolean
): PickerWorld {
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
