import React from "react";
import { View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setText, stepDose } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { bodySummary, focusLabel, type LibraryWorkout } from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { IntervalsBar } from "../components/IntervalsBar";
import { Label } from "../components/Label";
import { PreviewRow } from "./PreviewRow";
import { ProjectRow } from "./ProjectRow";

export type BodyPreviewProps = { workout: LibraryWorkout; unit: WeightUnit };

/** What the workout holds, read only: its exercises, items, steps or climbing focus. */
export function BodyPreview({ workout, unit }: BodyPreviewProps): React.ReactElement | null {
  const body = workout.body;
  if (body === null) return <DashedPanel body={t("workouts.noBody")} />;
  if (body.kind === "hang") return null;
  return (
    <View style={{ gap: 4 }}>
      <Label color={colors.gunmetal}>{bodySummary(workout)}</Label>
      {body.kind === "sets" &&
        body.exercises.map((e, i) => (
          <PreviewRow
            key={i}
            title={e.name}
            detail={e.sets.map((s) => setText(s, unit) || "·").join("  /  ")}
          />
        ))}
      {body.kind === "checklist" &&
        body.items.map((item, i) => <PreviewRow key={i} title={item.text} detail={item.dose} />)}
      {body.kind === "intervals" && (
        <>
          <View style={{ flexDirection: "row", paddingVertical: 8 }}>
            <IntervalsBar intervals={body} height={14} />
          </View>
          {body.steps.map((s, i) => (
            <PreviewRow key={i} title={s.label} detail={stepDose(s, unit)} />
          ))}
        </>
      )}
      {body.kind === "climb" && (
        <>
          <PreviewRow title={t("workouts.focus")} detail={focusLabel(body.focus)} />
          {body.projectId !== null && <ProjectRow slug={body.projectId} />}
        </>
      )}
    </View>
  );
}
