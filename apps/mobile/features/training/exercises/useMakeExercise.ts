import { randomUUID } from "expo-crypto";
import { Alert } from "react-native";
import { useMakeExercise as useMake, type MakeExercise } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

/** Saves a new exercise from the signed-in user's training (see the shared hook). */
export function useMakeExercise(): MakeExercise {
  const { model, actions } = useHangData();
  return useMake(useApi(), model, actions, failed, randomUUID);
}
