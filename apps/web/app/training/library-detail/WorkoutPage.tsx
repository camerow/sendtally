import React from "react";
import { Link } from "react-router";
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
import { editWorkoutPath } from "../editor/paths";
import { useLibrary } from "../library/useLibrary";
import { logLink } from "../log/logLink";
import { activityPath } from "../log/paths";
import { BodyPreview } from "./BodyPreview";
import { LibraryIntro } from "./LibraryIntro";
import { PlanList } from "./PlanList";
import { PreviewRow } from "./PreviewRow";
import { ProtocolPanel } from "./ProtocolPanel";
import { useWorkoutMenu } from "./useWorkoutMenu";
import { WorkoutOverTime } from "./WorkoutOverTime";
import { schedulePath } from "../schedule/paths";

function Detail({
  workout,
  use,
}: {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
}): React.ReactElement {
  const api = useAppApi();
  const { model, today } = useHangData();
  const session = use?.count ?? 0;
  const exercises = useExercises(api).state;
  const activities = useActivities(api).state;
  const menu = useWorkoutMenu(workout);
  const logIt = logLink(workout, today, session);
  const hang = workout.kind === "hangboard" ? model.workout(workout.id) : undefined;
  const next = hang === undefined ? undefined : (hangWorkoutOf(workout, session) ?? hang);
  const gripId = hang === undefined ? "" : model.defaultGrip(hang);
  const last = next === undefined ? null : model.lastUsed(next, gripId);
  const lastUsed =
    next === undefined || last === null
      ? undefined
      : t("hang.lastUsedValue", { setup: setupLabel(next.kind, last, model.settings.units) });
  const history =
    hang === undefined
      ? ofWorkout(activities.status === "ready" ? activities.data : [], workout.id).map((a) =>
          activityItem(a, model.settings.units)
        )
      : ofWorkout(model.sessions, workout.id).map((s) => hangItem(s, model));

  return (
    <DetailFrame
      backTo="/app/train"
      action={
        <span className="detail-actions">
          {workout.source === "mine" && (
            <Link to={editWorkoutPath(workout.id)} className="edit-button">
              {t("common.edit")}
            </Link>
          )}
          <MoreMenu label={t("summary.more")} items={menu.items} />
        </span>
      }
      footer={
        <div className="footer-row">
          <Link to={schedulePath(workout.id)} className="footer-outline">
            {t("plan.addToPlan")}
          </Link>
          {logIt !== null && (
            <Link to={logIt} className="footer-outline">
              {t("workouts.logIt")}
            </Link>
          )}
        </div>
      }
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
      <HistoryList items={history} to={activityPath} />
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
