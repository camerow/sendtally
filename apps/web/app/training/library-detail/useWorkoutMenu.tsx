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
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { workoutPath } from "../library/useLibrary";

export type WorkoutMenu = { items: MoreMenuItem[]; confirm: React.ReactNode };

/**
 * A workout's ··· menu: Duplicate, which opens the copy in the original's place, and Delete
 * for the user's own, which asks first and then leaves the page.
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
  const duplicate = (): void => {
    const id = crypto.randomUUID();
    void actions.saveWorkout(id, { ...draftOf(workout), name: copyName(workout.name) });
    void navigate(workoutPath(id), { replace: true });
  };
  const remove = (): void => {
    setDeleting(false);
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    void (idx > 0 ? navigate(-1) : navigate("/app/train", { replace: true }));
    void actions.deleteWorkout(workout.id);
  };
  return {
    items: [
      { label: t("workouts.duplicate"), onSelect: duplicate },
      ...(workout.source === "mine"
        ? [{ label: t("workouts.delete"), onSelect: () => setDeleting(true), destructive: true }]
        : []),
    ],
    confirm: (
      <Sheet
        open={deleting}
        title={t("workouts.deleteTitle", { name: workout.name })}
        onClose={() => setDeleting(false)}
        action={{ label: t("common.delete"), danger: true, onPress: remove }}
      >
        <p className="sheet-body">{t("workouts.deleteBody")}</p>
      </Sheet>
    ),
  };
}
