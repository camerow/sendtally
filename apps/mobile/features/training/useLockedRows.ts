import type React from "react";
import { Alert } from "react-native";
import {
  exerciseRemoval,
  useExerciseActions,
  type PickerSource,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExerciseSeries } from "@sendtally/features/statistics";
import type { LockSource } from "@sendtally/features/training";
import { useWorkoutActions, type LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../lib/api";
import {
  archiveGripRow,
  deleteBlockRow,
  deleteWorkoutRow,
  removeExerciseRow,
} from "./components/deleteRow";
import type { DetailMenuRow, LongPress } from "./components/types";
import { useHoldMenu } from "./components/useHoldMenu";
import { useHangData } from "./data/HangDataContext";
import { useLibrary } from "./library/useLibrary";
import { openMembershipPage, useLocks } from "./locks";
import { usePlanActions } from "./plan/usePlanActions";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

/** How a row presses: its own page, or locked, the Membership page with Delete on a long press. */
export type RowPress = { onPress: () => void; locked?: boolean; hold?: LongPress };

export type LockedRows<T> = {
  row: (thing: T, open: () => void) => RowPress;
  /** The sheet a long press opens, once per list. */
  sheet: React.ReactElement;
};

function useLockedRows<T>(
  source: LockSource,
  locked: (thing: T) => boolean,
  remove: (thing: T) => DetailMenuRow | undefined
): LockedRows<T> {
  const { hold, sheet } = useHoldMenu();
  return {
    row: (thing, open) => {
      if (!locked(thing)) return { onPress: open };
      const row = remove(thing);
      return {
        locked: true,
        onPress: () => openMembershipPage(source),
        hold: row === undefined ? undefined : hold(row),
      };
    },
    sheet,
  };
}

export function useLockedWorkouts(): LockedRows<LibraryWorkout> {
  const locks = useLocks();
  const actions = useWorkoutActions(useApi(), failed);
  return useLockedRows<LibraryWorkout>("workout", locks.workout, (w) =>
    deleteWorkoutRow(w.name, () => void actions.deleteWorkout(w.id), true)
  );
}

export type LockedExercise = { source: PickerSource; name: string };

export function useLockedExercises(): LockedRows<LockedExercise> {
  const api = useApi();
  const locks = useLocks();
  const { actions } = useHangData();
  const exercises = useExerciseActions(api, failed);
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  return useLockedRows(
    "exercise",
    (e) => locks.exercise(e.source),
    ({ source, name }) => {
      const r = exerciseRemoval(source, library, series);
      return r === undefined
        ? undefined
        : "grip" in r
          ? archiveGripRow(name, () => void actions.archiveGrip(r.grip), true)
          : removeExerciseRow(name, r.inUse, () => void exercises.remove(r.exercise.id), true);
    }
  );
}

export function useLockedBlocks(): LockedRows<{ id: string; name: string }> {
  const locks = useLocks();
  const actions = usePlanActions();
  return useLockedRows(
    "block",
    () => locks.block,
    (b) => deleteBlockRow(b.name, () => void actions.deleteBlock(b.id), true)
  );
}
