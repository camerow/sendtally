import React from "react";
import {
  exerciseRemoval,
  useExerciseActions,
  type PickerSource,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExerciseSeries } from "@sendtally/features/statistics";
import { deleteCopy, type DeleteCopy, type LockSource } from "@sendtally/features/training";
import { useWorkoutActions, type LibraryWorkout } from "@sendtally/features/workouts";
import { MoreMenu } from "../components/MoreMenu";
import { useToast } from "../components/Toast";
import { useAppApi } from "../lib/useAppApi";
import { DeleteSheet } from "./components/DeleteSheet";
import { useHangData } from "./data/HangDataContext";
import { usePlanActions } from "./data/usePlanActions";
import { useLibrary } from "./library/useLibrary";
import { membershipPagePath, useLocks } from "./locks";

/** Where a row goes: its own page, or locked, the Membership page with a ··· holding only Delete. */
export type RowLink = { to: string; locked?: boolean; menu?: React.ReactNode };

export type LockedRows<T> = {
  row: (thing: T, to: string) => RowLink;
  /** The delete confirm a locked row's ··· opens, once per list. */
  sheet: React.ReactNode;
};

type Removal = { flow: DeleteCopy; onDelete: () => void };

function useLockedRows<T>(
  source: LockSource,
  locked: (thing: T) => boolean,
  remove: (thing: T) => Removal | undefined
): LockedRows<T> {
  const [deleting, setDeleting] = React.useState<Removal | null>(null);
  return {
    row: (thing, to) => {
      if (!locked(thing)) return { to };
      const removal = remove(thing);
      return {
        to: membershipPagePath(source),
        locked: true,
        menu: removal && (
          <MoreMenu
            label={t("summary.more")}
            items={[
              { label: removal.flow.item, destructive: true, onSelect: () => setDeleting(removal) },
            ]}
          />
        ),
      };
    },
    sheet: deleting !== null && (
      <DeleteSheet
        flow={deleting.flow}
        onClose={() => setDeleting(null)}
        onDelete={deleting.onDelete}
      />
    ),
  };
}

function useFailed(): () => void {
  const toast = useToast();
  return React.useCallback(() => toast.show({ message: t("workouts.saveFailed") }), [toast]);
}

export function useLockedWorkouts(): LockedRows<LibraryWorkout> {
  const locks = useLocks();
  const actions = useWorkoutActions(useAppApi(), useFailed());
  return useLockedRows<LibraryWorkout>("workout", locks.workout, (w) => ({
    flow: deleteCopy("workout", w.name),
    onDelete: () => void actions.deleteWorkout(w.id),
  }));
}

export type LockedExercise = { source: PickerSource; name: string };

export function useLockedExercises(): LockedRows<LockedExercise> {
  const api = useAppApi();
  const locks = useLocks();
  const { actions } = useHangData();
  const exercises = useExerciseActions(api, useFailed());
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  return useLockedRows<LockedExercise>(
    "exercise",
    (e) => locks.exercise(e.source),
    ({ source, name }) => {
      const r = exerciseRemoval(source, library, series);
      return (
        r &&
        ("grip" in r
          ? { flow: deleteCopy("grip", name), onDelete: () => void actions.archiveGrip(r.grip) }
          : {
              flow: deleteCopy("exercise", name, r.inUse),
              onDelete: () => void exercises.remove(r.exercise.id),
            })
      );
    }
  );
}

export function useLockedBlocks(): LockedRows<{ id: string; name: string }> {
  const locks = useLocks();
  const actions = usePlanActions();
  return useLockedRows<{ id: string; name: string }>(
    "block",
    () => locks.block,
    (b) => ({ flow: deleteCopy("block", b.name), onDelete: () => void actions.deleteBlock(b.id) })
  );
}
