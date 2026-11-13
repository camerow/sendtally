import { useQueryClient } from "@tanstack/react-query";
import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import { defaultMeasure } from "@sendtally/core/hang";
import { findGrip, type HangModel } from "../hang/model";
import type { HangActions } from "../hang/useHangActions";
import { queries } from "../query";
import { takenBy } from "./makeExercise";
import { exerciseKindOf } from "./measure";
import type { ExerciseForm, MadeExercise } from "./types";

export type MakeExercise = (form: ExerciseForm, builtIn?: string) => Promise<MadeExercise | null>;

/**
 * Saves a new exercise: Fingers as a grip, anything else as the user's exercise, linked to
 * the built-in it was picked from. A name already taken gives that one back instead. The
 * cached list holds it at once, so a workout can ask for its measure before the refetch.
 * Null when saving failed, which `onError` has reported.
 */
export function useMakeExercise(
  api: SendtallyApi,
  model: Pick<HangModel, "grips">,
  actions: Pick<HangActions, "saveGrip">,
  onError: (error: unknown) => void,
  newId: () => string
): MakeExercise {
  const client = useQueryClient();
  const listed = (exercise: Exercise): { exercise: Exercise } => {
    client.setQueryData<Exercise[]>(queries.exercises(api).queryKey, (list) =>
      list === undefined ? list : [...list.filter((e) => e.id !== exercise.id), exercise]
    );
    return { exercise };
  };
  return async ({ kind, name, measure, eachSide, progress }, builtIn) => {
    const exerciseKind = exerciseKindOf(kind);
    if (exerciseKind === null) {
      const existing = findGrip(model.grips, name);
      const pulls = measure === "repsWeight" || measure === "secondsWeight";
      const made = { id: newId(), name, custom: true, ...(pulls ? { measure } : {}) };
      const grip = { ...(existing ?? made), hidden: false };
      if (existing === undefined || existing.hidden) void actions.saveGrip(grip);
      return { grip };
    }
    try {
      const input = {
        name,
        kind: exerciseKind,
        measure: measure === "hang" ? defaultMeasure(exerciseKind) : measure,
        eachSide,
        progress: progress ?? null,
        builtIn: builtIn ?? null,
      };
      return listed((await api.saveExercise(newId(), input)).exercise);
    } catch (error) {
      const taken = takenBy(error);
      if (taken !== undefined) return listed(taken);
      onError(error);
      return null;
    }
  };
}
