import type { Dose, HangWorkout, PlanLink } from "@sendtally/core/hang";
import { hangWorkoutFromItem } from "@sendtally/features/hang";
import { useHangData } from "../data/HangDataContext";
import { usePrescribed } from "../data/usePrescribed";

export type PlannedRun = { workout: HangWorkout; dose: Dose | undefined };

/**
 * What the timer runs: the workout's variation as written, or with a plan its week's
 * prescription. Undefined while it loads, or when the workout is gone.
 */
export function usePlannedRun(workoutId: string, link: PlanLink): PlannedRun | undefined {
  const { model } = useHangData();
  const items = usePrescribed(workoutId, link);
  const written = model.workout(workoutId, link.variation ?? 0);
  const [item] = items ?? [];
  if (written === undefined || items === undefined) return undefined;
  return item === undefined
    ? { workout: written, dose: undefined }
    : { workout: hangWorkoutFromItem(written, item), dose: item.dose };
}
