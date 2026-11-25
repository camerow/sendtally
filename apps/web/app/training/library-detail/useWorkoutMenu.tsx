import React from "react";
import { useNavigate } from "react-router";
import { t } from "@sendtally/features/i18n";
import {
  copyName,
  draftOf,
  useWorkoutActions,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useAddToBlock } from "../blocks/useAddToBlock";
import { DeleteSheet } from "../components/DeleteSheet";
import { deleteWorkoutFlow } from "../components/deleteFlows";
import { useCreateGate } from "../locks";
import { WORKOUTS_VIEW, workoutPath } from "../library/useLibrary";

export type WorkoutMenu = { items: MoreMenuItem[]; sheets: React.ReactNode };

/**
 * A workout's ··· menu: Add to block, Duplicate, which opens the copy in the original's place,
 * and Delete for the user's own, which asks first and then leaves the page. Without access
 * Add to block and Duplicate wear the lock.
 */
export function useWorkoutMenu(workout: LibraryWorkout): WorkoutMenu {
  const navigate = useNavigate();
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useWorkoutActions(useAppApi(), failed);
  const [deleting, setDeleting] = React.useState(false);
  const addToBlock = useAddToBlock(workout.name, workout.id);
  const gate = useCreateGate("workout");
  const flow = deleteWorkoutFlow(workout.name);
  const duplicate = (): void => {
    const id = crypto.randomUUID();
    void actions.saveWorkout(id, { ...draftOf(workout), name: copyName(workout.name) });
    void navigate(workoutPath(id), { replace: true });
  };
  const remove = (): void => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    void (idx > 0 ? navigate(-1) : navigate(WORKOUTS_VIEW, { replace: true }));
    void actions.deleteWorkout(workout.id);
  };
  return {
    items: [
      ...(addToBlock.item === null ? [] : [gate(addToBlock.item)]),
      gate({ label: t("workouts.duplicate"), onSelect: duplicate }),
      ...(workout.source === "mine"
        ? [{ label: flow.item, onSelect: () => setDeleting(true), destructive: true }]
        : []),
    ],
    sheets: (
      <>
        {addToBlock.sheet}
        {deleting && (
          <DeleteSheet flow={flow} onClose={() => setDeleting(false)} onDelete={remove} />
        )}
      </>
    ),
  };
}
