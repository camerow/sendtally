import type { SendtallyApi } from "@sendtally/api-client";
import type { Dose, HangWorkout, PlanLink } from "@sendtally/core/hang";
import { hangWorkoutFromItem, type HangModel } from "../hang/model";
import { usePrescribed } from "./usePrescribed";
import { useWorkoutLibrary } from "./useWorkoutLibrary";

/** One item as the timer runs it. */
export type PlannedItem = { workout: HangWorkout; dose: Dose | undefined };

/** Every item in turn, the first always there, and the rest between them. */
export type PlannedRun = { items: [PlannedItem, ...PlannedItem[]]; exerciseRestS: number };

/**
 * What the timer runs: the doses its session takes, or with a plan its week's
 * prescription. Undefined while it loads, or when the workout is gone.
 */
export function usePlannedRun(
  api: SendtallyApi,
  model: Pick<HangModel, "workout">,
  workoutId: string,
  link: PlanLink,
  session: number
): PlannedRun | undefined {
  const library = useWorkoutLibrary(api).state;
  const items = usePrescribed(api, workoutId, link, session);
  const written = model.workout(workoutId);
  if (written === undefined || items === undefined) return undefined;
  const exerciseRestS =
    library.status === "ready" ? (library.data.workout(workoutId)?.exerciseRestS ?? 0) : 0;
  const [first = { workout: written, dose: undefined }, ...rest] = items.map((item) => ({
    workout: hangWorkoutFromItem(written, item),
    dose: item.dose,
  }));
  return { items: [first, ...rest], exerciseRestS };
}
