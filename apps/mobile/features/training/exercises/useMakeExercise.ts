import { randomUUID } from "expo-crypto";
import { Alert } from "react-native";
import { exerciseKindOf } from "@sendtally/features/exercises";
import { findGrip } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { takenBy } from "./takenBy";
import type { ExerciseForm, MadeExercise } from "./types";

/**
 * Saves a new exercise: Fingers as a grip, anything else as the user's exercise, linked to
 * the built-in it was picked from. A name already taken gives that one back instead.
 * Null when saving failed, which has been reported.
 */
export function useMakeExercise(): (
  form: ExerciseForm,
  builtIn?: string
) => Promise<MadeExercise | null> {
  const api = useApi();
  const { model, actions } = useHangData();
  return async ({ kind, name, measure, eachSide }, builtIn) => {
    const exerciseKind = exerciseKindOf(kind);
    if (exerciseKind === null) {
      const existing = findGrip(model.grips, name);
      const grip = { ...(existing ?? { id: randomUUID(), name, custom: true }), hidden: false };
      if (existing === undefined || existing.hidden) void actions.saveGrip(grip);
      return { grip };
    }
    try {
      const input = { name, kind: exerciseKind, measure, eachSide, builtIn: builtIn ?? null };
      return await api.saveExercise(randomUUID(), input);
    } catch (error) {
      const taken = takenBy(error);
      if (taken !== undefined) return { exercise: taken };
      Alert.alert(t("workouts.saveFailed"));
      return null;
    }
  };
}
