import React from "react";
import {
  pickWith,
  useMakeExercise,
  type MakeExercise,
  type PickerSource,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import type { Picked } from "@sendtally/features/workouts";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";

const newId = (): string => crypto.randomUUID();

/** Saves a new exercise from the signed-in user's training, reporting a failure in a toast. */
export function useMake(): MakeExercise {
  const { model, actions } = useHangData();
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  return useMakeExercise(useAppApi(), model, actions, failed, newId);
}

/** What a picker row adds to a workout (see `pickWith`). */
export function usePick(): (source: PickerSource) => Promise<Picked | null> {
  return pickWith(useMake());
}
