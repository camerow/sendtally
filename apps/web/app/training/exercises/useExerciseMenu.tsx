import React from "react";
import { useNavigate } from "react-router";
import type { Exercise } from "@sendtally/api-client";
import { exerciseLabel, useExerciseActions } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { DeleteSheet } from "../components/DeleteSheet";
import { removeExerciseFlow } from "../components/deleteFlows";
import { EXERCISES_VIEW, exercisePath } from "./paths";

export type ExerciseMenu = { items: MoreMenuItem[]; sheets: React.ReactNode };

type Open = { kind: "merge" } | { kind: "mergeInto"; into: Exercise } | { kind: "remove" } | null;

/**
 * An exercise's ··· menu: Merge into, which asks which exercise and then to be sure, and
 * Archive (Delete when nothing uses it), which asks first and then leaves the page.
 */
export function useExerciseMenu(
  exercise: Exercise,
  others: readonly Exercise[],
  inUse: boolean
): ExerciseMenu {
  const navigate = useNavigate();
  const back = useGoBack(EXERCISES_VIEW);
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useExerciseActions(useAppApi(), failed);
  const [open, setOpen] = React.useState<Open>(null);
  const close = (): void => setOpen(null);
  const name = exerciseLabel(exercise);
  const sorted = [...others].sort(
    (a, b) => Number(b.kind === exercise.kind) - Number(a.kind === exercise.kind)
  );
  const merge = { label: t("workouts.mergeExercise"), onSelect: () => setOpen({ kind: "merge" }) };
  const flow = removeExerciseFlow(name, inUse);
  const items: MoreMenuItem[] = exercise.archived
    ? [merge]
    : [merge, { label: flow.item, onSelect: () => setOpen({ kind: "remove" }), destructive: true }];

  return {
    items,
    sheets: (
      <>
        <Sheet open={open?.kind === "merge"} title={t("workouts.mergeExercise")} onClose={close}>
          <div className="option-list">
            {sorted.map((e) => (
              <button
                key={e.id}
                type="button"
                className="option-row"
                onClick={() => setOpen({ kind: "mergeInto", into: e })}
              >
                {exerciseLabel(e)}
              </button>
            ))}
          </div>
        </Sheet>
        {open?.kind === "mergeInto" && (
          <Sheet
            open
            title={t("workouts.mergeExerciseTitle", { from: exercise.name, into: open.into.name })}
            onClose={close}
            action={{
              label: t("workouts.merge"),
              danger: true,
              onPress: () => {
                const { into } = open;
                close();
                void actions.merge(exercise, into).then((done) => {
                  if (done) void navigate(exercisePath(into.id), { replace: true });
                });
              },
            }}
          >
            <p className="sheet-body">
              {t("workouts.mergeExerciseBody", { from: exercise.name, into: open.into.name })}
            </p>
          </Sheet>
        )}
        {open?.kind === "remove" && (
          <DeleteSheet
            flow={flow}
            onClose={close}
            onDelete={() => {
              back();
              void actions.remove(exercise.id);
            }}
          />
        )}
      </>
    ),
  };
}
