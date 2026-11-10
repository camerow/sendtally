import { router } from "expo-router";
import React from "react";
import { entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { LogWorkoutSheet } from "../training/library-detail/LogWorkoutSheet";
import { LogEmpty } from "./LogEmpty";

const ENTRIES: readonly EntryKind[] = ["journal", "injury"];

/** The training half before its first entry: a preview, Start a workout, and the other ways in. */
export function TrainingEmpty(): React.ReactElement {
  const [picking, setPicking] = React.useState(false);
  return (
    <>
      <LogEmpty
        count={t("plan.workoutCount", { count: 2 })}
        examples={[
          {
            daysAgo: 1,
            kind: "hangboard",
            title: t("training.exampleHangs"),
            meta: t("training.exampleHangsMeta"),
          },
          {
            daysAgo: 4,
            kind: "strength",
            title: t("training.examplePull"),
            meta: t("training.examplePullMeta"),
          },
        ]}
        title={t("training.firstWorkout")}
        primary={{
          label: t("training.startWorkout"),
          onPress: () =>
            router.navigate({ pathname: "/(tabs)/train", params: { view: "workouts" } }),
        }}
        actions={[
          {
            key: "workout",
            icon: "train",
            title: t("training.logWorkout"),
            onPress: () => setPicking(true),
          },
          ...ENTRIES.map((kind) => ({
            key: kind,
            icon: kind,
            title: entryKindLabel(kind),
            onPress: () =>
              router.push({ pathname: "/journal/new", params: { kind, date: today() } }),
          })),
        ]}
      />
      <LogWorkoutSheet visible={picking} onClose={() => setPicking(false)} />
    </>
  );
}
