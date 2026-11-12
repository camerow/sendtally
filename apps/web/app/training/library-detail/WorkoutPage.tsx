import React from "react";
import { activityItem, hangItem, ofWorkout, useActivities } from "@sendtally/features/activities";
import { tallyMeasuresOf } from "@sendtally/features/exercises";
import { hangWorkoutOf, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import { workoutMinutes, type LibraryWorkout, type WorkoutUse } from "@sendtally/features/workouts";
import { MoreMenu } from "../../components/MoreMenu";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { HistoryList } from "../../components/detail/HistoryList";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { BodyPreview } from "./BodyPreview";
import { LibraryIntro } from "./LibraryIntro";
import { PlanList } from "./PlanList";
import { PreviewRow } from "./PreviewRow";
import { ProtocolPanel } from "./ProtocolPanel";
import { useWorkoutMenu } from "./useWorkoutMenu";
import { WorkoutOverTime } from "./WorkoutOverTime";

const nowhere = (): string => "";

function Detail({
  workout,
  use,
}: {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
}): React.ReactElement {
  const api = useAppApi();
  const { model } = useHangData();
  const session = use?.count ?? 0;
  const exercises = useExercises(api).state;
  const activities = useActivities(api).state;
  const menu = useWorkoutMenu(workout);
  const hang = workout.kind === "hangboard" ? model.workout(workout.id) : undefined;
  const next = hang === undefined ? undefined : (hangWorkoutOf(workout, session) ?? hang);
  const gripId = hang === undefined ? "" : model.defaultGrip(hang);
  const last = next === undefined ? null : model.lastUsed(next, gripId);
  const lastUsed =
    next === undefined || last === null
      ? undefined
      : t("hang.lastUsedValue", { setup: setupLabel(next.kind, last, model.settings.units) });
  // ponytail: rows open nothing until the activity pages land (#278).
  const history = (
    hang === undefined
      ? ofWorkout(activities.status === "ready" ? activities.data : [], workout.id).map((a) =>
          activityItem(a, model.settings.units)
        )
      : ofWorkout(model.sessions, workout.id).map((s) => hangItem(s, model))
  ).map((item) => ({ ...item, opens: false }));

  return (
    <DetailFrame
      backTo="/app/train"
      action={<MoreMenu label={t("summary.more")} items={menu.items} />}
    >
      <LibraryIntro workout={workout} use={use} />
      <section className="detail-section">
        <SectionHeading title={t("workouts.exercises")} />
        {next === undefined ? (
          <BodyPreview
            workout={workout}
            unit={model.settings.units}
            session={session}
            tally={tallyMeasuresOf(
              exercises.status === "ready" ? exercises.data : [],
              workout.kind
            )}
          />
        ) : (
          <PreviewRow title={model.gripName(gripId)} detail="" note={lastUsed} />
        )}
      </section>
      {next !== undefined && (
        <ProtocolPanel workout={next} minutes={workoutMinutes(workout, session)} />
      )}
      {hang === undefined && <WorkoutOverTime workout={workout} />}
      <HistoryList items={history} to={nowhere} />
      <PlanList workoutId={workout.id} name={workout.name} kind={workout.kind} />
      {menu.confirm}
    </DetailFrame>
  );
}

/** A workout: what it holds, how it is going, its past sessions and where it is planned. */
export function WorkoutPage({ id }: { id: string }): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const workout = state.data.workout(id);
  return workout === undefined ? null : <Detail workout={workout} use={state.data.usage.get(id)} />;
}
