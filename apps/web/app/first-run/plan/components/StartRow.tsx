import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  estimatedMinutes,
  unplannedItems,
  workoutMinutes,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { MenuRow } from "../../../components/MenuRow";
import { useHangData } from "../../../training/data/HangDataContext";
import { useWorkoutStart } from "../../../training/library-detail/useWorkoutStart";
import { useLibrary } from "../../../training/library/useLibrary";

export type StartRowProps = {
  workout: LibraryWorkout;
  /** Runs before the player opens. */
  onStart: () => void;
};

/** P7's way into the first workout: its player, today, as the workout's next session. */
export function StartRow({ workout, onStart }: StartRowProps): React.ReactElement {
  const { today } = useHangData();
  const { state } = useLibrary();
  const session = state.status === "ready" ? (state.data.usage.get(workout.id)?.count ?? 0) : 0;
  const start = useWorkoutStart(workout, today, unplannedItems(workout, session));
  const minutes = workoutMinutes(workout) ?? estimatedMinutes(workout);
  return (
    <MenuRow
      icon="train"
      title={t("onboarding.plan.done.startNow", { name: workout.name })}
      {...(minutes === null ? {} : { hint: t("onboarding.plan.done.startHint", { minutes }) })}
      onPress={() => {
        if (start === null) return;
        onStart();
        start.onPress();
      }}
    />
  );
}
