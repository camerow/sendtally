import React from "react";
import { Text } from "react-native";
import type { ActivityRecord, HangPart } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  effortTile,
  hangGrids,
  isClimbingSets,
  kindLabel,
  setReadText,
  type ActivityActions,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import { type TrainingLog, KIND_LOOK } from "@sendtally/features/training";
import { supersetHeadAt } from "@sendtally/features/workouts";
import { ChecklistCard } from "../sets/ChecklistCard";
import { ClimbSetsRead } from "../climbing/ClimbSetsRead";
import { EffortMark } from "../components/EffortMark";
import { useApi } from "../../../lib/api";
import { openExerciseHistory } from "../exercises/openExerciseHistory";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SetRow } from "../sets/SetRow";
import { type } from "../type";
import { HangResultCard } from "./HangResultCard";
import { SummaryFrame } from "./SummaryFrame";

export type ActivitySummaryProps = {
  activity: ActivityRecord;
  log: TrainingLog;
  unit: WeightUnit;
  actions: ActivityActions;
  /** Its workout's fingerboard part, if it ran one, with its grips named. */
  part?: { session: HangPart; gripName: (id: string) => string };
};

/**
 * A finished strength, mobility or other workout: its length and RPE, its notes, its fingerboard
 * part grip by grip, and each exercise as done, a superset's members under its label.
 */
export function ActivitySummary({
  activity,
  log,
  unit,
  actions,
  part,
}: ActivitySummaryProps): React.ReactElement {
  const exercises = useExercises(useApi()).state;
  const mine = exercises.status === "ready" ? exercises.data : null;
  const grids = part === undefined ? [] : hangGrids(part.session);
  const done = activity.done.filter((d) => d.sets.length > 0 || d.checklist !== undefined);
  const target = activity.workoutId === null ? null : log.workout(activity.workoutId);
  return (
    <SummaryFrame
      kicker={kindLabel(activity.kind)}
      kickerColor={KIND_LOOK[activity.kind].ink}
      title={activity.title}
      tiles={[
        { value: t("hang.minutes", { n: activity.minutes }), label: t("summary.length") },
        effortTile(activity.rpe, target?.targetRpe ?? null),
      ]}
      target={{ kind: "activity", record: activity }}
      onDelete={() => void actions.deleteActivity(activity.id)}
    >
      {activity.notes !== null && activity.notes !== "" && (
        <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.gunmetal }]}>
          {activity.notes}
        </Text>
      )}
      {grids.map((grid, i) => (
        <HangResultCard
          key={i}
          grid={grid}
          gripName={part?.gripName(grid.gripId) ?? ""}
          unit={unit}
        />
      ))}
      {done.map((d, i) => {
        const head = supersetHeadAt(done, i);
        if (d.checklist !== undefined) {
          const { lines, checked } = d.checklist;
          return (
            <ChecklistCard
              key={`${d.item}-checklist`}
              lines={lines}
              ticked={(line) => checked.includes(line)}
            />
          );
        }
        const history = openExerciseHistory(mine, d.exercise);
        const rated = d.sets.some((set) => set.rpe !== undefined);
        return (
          <React.Fragment key={`${d.item}-${d.exercise}`}>
            {head !== null && (
              <Text
                style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal, paddingTop: 4 }]}
              >
                {head}
              </Text>
            )}
            <ExerciseBlock
              head={
                <ExerciseHead
                  name={d.exercise}
                  {...(history !== undefined && { onHistory: history })}
                />
              }
            >
              {isClimbingSets(d.sets) && d.sets.every((set) => set.onS === undefined) ? (
                <ClimbSetsRead sets={d.sets} />
              ) : (
                d.sets.map((set, n) => (
                  <SetRow
                    key={n}
                    mode="read"
                    position={String(n + 1)}
                    label={t("activities.setOf", { exercise: d.exercise, n: n + 1 })}
                    {...(rated && {
                      rpe: set.rpe === undefined ? null : <EffortMark rpe={set.rpe} />,
                    })}
                  >
                    <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>
                      {setReadText(set, unit)}
                    </Text>
                  </SetRow>
                ))
              )}
            </ExerciseBlock>
          </React.Fragment>
        );
      })}
    </SummaryFrame>
  );
}
