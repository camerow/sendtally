import type { Dose, HangWorkout, PlanLink } from "@sendtally/core/hang";
import { hangWorkoutFromItem } from "@sendtally/features/hang";
import { useWorkoutLibrary } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { usePrescribed } from "../data/usePrescribed";

/** One item as the timer runs it. */
export type PlannedItem = { workout: HangWorkout; dose: Dose | undefined };

/** Every item in turn, the first always there, and the rest between them. */
export type PlannedRun = { items: [PlannedItem, ...PlannedItem[]]; exerciseRestS: number };

/**
 * What the timer runs: the workout's variation as written, or with a plan its week's
 * prescription. Undefined while it loads, or when the workout is gone.
 */
export function usePlannedRun(workoutId: string, link: PlanLink): PlannedRun | undefined {
  const { model } = useHangData();
  const library = useWorkoutLibrary(useApi()).state;
  const items = usePrescribed(workoutId, link);
  const written = model.workout(workoutId, link.variation ?? 0);
  if (written === undefined || items === undefined) return undefined;
  const exerciseRestS =
    library.status === "ready" ? (library.data.workout(workoutId)?.exerciseRestS ?? 0) : 0;
  const [first = { workout: written, dose: undefined }, ...rest] = items.map((item) => ({
    workout: hangWorkoutFromItem(written, item),
    dose: item.dose,
  }));
  return { items: [first, ...rest], exerciseRestS };
}
