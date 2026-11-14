import React from "react";
import { useNavigate } from "react-router";
import { t } from "@sendtally/features/i18n";
import {
  draftOf,
  useWorkoutActions,
  withEditorIds,
  withItemsAdded,
  type Picked,
} from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useLibrary, workoutPath } from "../library/useLibrary";

export type AddToWorkoutArgs = {
  name: string;
  picked: Picked;
  /** A Fingers exercise goes in Fingers workouts, any other in the rest. */
  fingers: boolean;
  /** The workouts already using it. */
  usedIn: readonly { id: string }[];
};

export type AddToWorkout = { item: MoreMenuItem | null; sheet: React.ReactNode };

const newId = (): string => crypto.randomUUID();

/**
 * An exercise's Add to workout: any of the user's own workouts it fits, at the end. One press
 * adds it and closes; a toast says where it went, with View.
 */
export function useAddToWorkout({ name, picked, fingers, usedIn }: AddToWorkoutArgs): AddToWorkout {
  const navigate = useNavigate();
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useWorkoutActions(useAppApi(), failed);
  const library = useLibrary().state;
  const [open, setOpen] = React.useState(false);
  const workouts =
    library.status === "ready"
      ? library.data.workouts.filter(
          (w) => w.source === "mine" && (w.kind === "hangboard") === fingers
        )
      : [];
  const title = t("workouts.addToWorkout");
  return {
    item: workouts.length === 0 ? null : { label: title, onSelect: () => setOpen(true) },
    sheet: (
      <Sheet open={open} title={title} onClose={() => setOpen(false)}>
        <span className="train-label">{name}</span>
        <div className="option-list">
          {workouts.map((w) => {
            const there = usedIn.some((u) => u.id === w.id);
            return (
              <button
                key={w.id}
                type="button"
                className="option-row"
                aria-pressed={there}
                disabled={there}
                onClick={() => {
                  setOpen(false);
                  void actions.saveWorkout(
                    w.id,
                    withItemsAdded(withEditorIds(draftOf(w), newId), [picked], newId)
                  );
                  toast.show({
                    message: t("common.addedTo", { name: w.name }),
                    action: {
                      label: t("common.view"),
                      onPress: () => void navigate(workoutPath(w.id)),
                    },
                  });
                }}
              >
                {w.name}
              </button>
            );
          })}
        </div>
      </Sheet>
    ),
  };
}
