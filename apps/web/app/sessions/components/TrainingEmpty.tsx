import React from "react";
import { t } from "@sendtally/features/i18n";
import { entryKindLabel, today } from "@sendtally/features/journal";
import { LogEmpty } from "./LogEmpty";

/** The training log before its first workout: a preview, and the ways in the web has so far. */
export function TrainingEmpty(): React.ReactElement {
  return (
    <LogEmpty
      count={t("plan.workoutCount", { count: 2 })}
      examples={[
        { daysAgo: 1, title: t("training.exampleHangs"), meta: t("training.exampleHangsMeta") },
        { daysAgo: 4, title: t("training.examplePull"), meta: t("training.examplePullMeta") },
      ]}
      title={t("training.firstWorkout")}
      actions={(["journal", "injury"] as const).map((kind) => ({
        key: kind,
        icon: kind,
        title: entryKindLabel(kind),
        to: `/app/journal/new?kind=${kind}&date=${today()}`,
      }))}
    />
  );
}
