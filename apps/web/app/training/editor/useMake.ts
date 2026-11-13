import React from "react";
import {
  pickedOf,
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

/**
 * What a picker row adds to a workout. A built-in becomes the user's own exercise first,
 * linked to it so its name stays translated; null when that save failed.
 */
export function usePick(): (source: PickerSource) => Promise<Picked | null> {
  const make = useMake();
  return async (source) => {
    if (!("builtIn" in source)) return pickedOf(source);
    const { id, name, kind, measure } = source.builtIn;
    const made = await make({ kind, name, measure, eachSide: false }, id);
    return made === null ? null : pickedOf(made);
  };
}
