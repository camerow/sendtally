import React from "react";
import type { ActivityRecord, HangPart } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
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
import { KIND_LOOK, type TrainingLog } from "@sendtally/features/training";
import { supersetHeadAt } from "@sendtally/features/workouts";
import { EffortMark } from "../../components/detail/EffortMark";
import { useAppApi } from "../../lib/useAppApi";
import { ClimbSetsRead } from "../climbing/ClimbSetsRead";
import { ChecklistCard } from "../components/ChecklistCard";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { exerciseHistoryPath } from "../components/exerciseHistory";
import { SetRow } from "../components/SetRow";
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
  const exercises = useExercises(useAppApi()).state;
  const mine = exercises.status === "ready" ? exercises.data : [];
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
        <p className="summary-notes">{activity.notes}</p>
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
        const head = supersetHeadAt(done, i);
        const history = exerciseHistoryPath(mine, d.exercise);
        const rated = d.sets.some((set) => set.rpe !== undefined);
        return (
          <React.Fragment key={`${d.item}-${d.exercise}`}>
            {head !== null && <span className="done-superset-head">{head}</span>}
            <ExerciseBlock
              head={<ExerciseHead name={d.exercise} {...(history !== undefined && { history })} />}
            >
              {isClimbingSets(d.sets) ? (
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
                    <span className="set-read-value">{setReadText(set, unit)}</span>
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
