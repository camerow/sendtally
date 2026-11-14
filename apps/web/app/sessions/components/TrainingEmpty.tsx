import React from "react";
import { t } from "@sendtally/features/i18n";
import { entryKindLabel, today } from "@sendtally/features/journal";
import { useNavigate } from "react-router";
import { LogWorkoutSheet } from "../../training/library-detail/LogWorkoutSheet";
import { WORKOUTS_VIEW } from "../../training/library/useLibrary";
import { LogEmpty } from "./LogEmpty";

/** The training log before its first workout: a preview, Start a workout, and the other ways in. */
export function TrainingEmpty(): React.ReactElement {
  const navigate = useNavigate();
  const [picking, setPicking] = React.useState(false);
  return (
    <>
      <LogEmpty
        count={t("plan.workoutCount", { count: 2 })}
        examples={[
          { daysAgo: 1, title: t("training.exampleHangs"), meta: t("training.exampleHangsMeta") },
          { daysAgo: 4, title: t("training.examplePull"), meta: t("training.examplePullMeta") },
        ]}
        title={t("training.firstWorkout")}
        primary={{ label: t("training.startWorkout"), onPress: () => void navigate(WORKOUTS_VIEW) }}
        actions={[
          {
            key: "workout",
            icon: "train",
            title: t("training.logWorkout"),
            onPress: () => setPicking(true),
          },
          ...(["journal", "injury"] as const).map((kind) => ({
            key: kind,
            icon: kind,
            title: entryKindLabel(kind),
            to: `/app/journal/new?kind=${kind}&date=${today()}`,
          })),
        ]}
      />
      <LogWorkoutSheet open={picking} onClose={() => setPicking(false)} />
    </>
  );
}
