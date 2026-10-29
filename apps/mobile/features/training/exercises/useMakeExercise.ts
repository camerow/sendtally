import { useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { Alert } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { defaultMeasure } from "@sendtally/core/hang";
import { exerciseKindOf } from "@sendtally/features/exercises";
import { findGrip } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { queries } from "@sendtally/features/query";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { takenBy } from "./takenBy";
import type { ExerciseForm, MadeExercise } from "./types";

/**
 * Saves a new exercise: Fingers as a grip, anything else as the user's exercise, linked to
 * the built-in it was picked from. A name already taken gives that one back instead. The
 * cached list holds it at once, so a workout can ask for its measure before the refetch.
 * Null when saving failed, which has been reported.
 */
export function useMakeExercise(): (
  form: ExerciseForm,
  builtIn?: string
) => Promise<MadeExercise | null> {
  const api = useApi();
  const client = useQueryClient();
  const { model, actions } = useHangData();
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
      const made = { id: randomUUID(), name, custom: true, ...(pulls ? { measure } : {}) };
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
      return listed((await api.saveExercise(randomUUID(), input)).exercise);
    } catch (error) {
      const taken = takenBy(error);
      if (taken !== undefined) return listed(taken);
      Alert.alert(t("workouts.saveFailed"));
      return null;
    }
  };
}
