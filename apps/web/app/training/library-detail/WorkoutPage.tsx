import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { Link, Navigate } from "react-router";
import { eachSideOf, tallyMeasuresOf } from "@sendtally/features/exercises";
import { hangWorkoutOf, useGrips } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { CalendarDate } from "@sendtally/core/hang";
import {
  blockName,
  plannedItems,
  trainingDay,
  useTrainingLog,
  type Occurrence,
} from "@sendtally/features/training";
import { useExercises } from "@sendtally/features/statistics";
import {
  bodyHeading,
  unplannedItems,
  workoutMinutes,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { MoreMenu } from "../../components/MoreMenu";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { useAppApi } from "../../lib/useAppApi";
import { SessionTargetContext } from "../components/sessionTarget";
import { StartButton } from "../components/StartButton";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { editWorkoutPath } from "../editor/paths";
import { exerciseHistoryPath } from "../components/exerciseHistory";
import { workoutHistoryPath } from "../history/paths";
import { WORKOUTS_VIEW, useLibrary } from "../library/useLibrary";
import { joinPath, useLocks } from "../locks";
import { plannedLogLink } from "../log/logLink";
import { MoveSheet } from "../plan-week/MoveSheet";
import { schedulePath } from "../schedule/paths";
import { BodyPreview } from "./BodyPreview";
import { DayLine } from "./DayLine";
import { LibraryIntro } from "./LibraryIntro";
import { PlanList } from "./PlanList";
import { ProtocolPanel } from "./ProtocolPanel";
import { useWorkoutMenu } from "./useWorkoutMenu";
import { useWorkoutStart } from "./useWorkoutStart";

/** A planned run a workout opens as: the day it lands on and the plan it is in. */
export type RunOf = { date: CalendarDate; membershipId: string };

type DetailProps = { workout: LibraryWorkout; session: number; run: Occurrence | undefined };

function Detail({ workout, session, run }: DetailProps): React.ReactElement {
  const api = useAppApi();
  const { isGrip } = useGrips(api);
  const { model, today } = useHangData();
  const exercises = useExercises(api).state;
  const mine = exercises.status === "ready" ? exercises.data : [];
  const menu = useWorkoutMenu(workout);
  const [moving, setMoving] = React.useState(false);
  const shown = run === undefined ? unplannedItems(workout, session) : plannedItems(run);
  const date = run?.date ?? today;
  const missed = run?.status === "missed";
  const logIt = plannedLogLink(workout, date, shown);
  const start = useWorkoutStart(workout, date, shown, true);
  const hang = workout.kind === "hangboard" ? model.workout(workout.id) : undefined;
  const next = hang === undefined ? undefined : (hangWorkoutOf(workout, shown.session) ?? hang);
  const gripId = hang === undefined ? "" : model.defaultGrip(hang);
  const minutes = workoutMinutes(workout, shown.session);
  const tiles = [
    ...(minutes === null
      ? []
      : [{ value: t("hang.minutes", { n: minutes }), label: t("summary.length") }]),
    ...(workout.targetRpe === null
      ? []
      : [{ value: `${workout.targetRpe}/10`, label: t("common.targetRpeLabel") }]),
  ];
  const tally = tallyMeasuresOf(mine, workout.kind, isGrip);
  const logButton = logIt !== null && (
    <Link to={logIt} replace className="outline-button outline-button--wide">
      {t("workouts.logIt")}
    </Link>
  );

  return (
    <DetailFrame
      backTo={run === undefined ? WORKOUTS_VIEW : "/app/plan"}
      hero={libraryPictures("workout", workout.id)}
      action={
        <span className="detail-actions">
          <Link to={workoutHistoryPath(workout.id)} className="edit-button">
            {t("common.history")}
          </Link>
          {workout.source === "mine" && run === undefined && (
            <Link to={editWorkoutPath(workout.id)} className="edit-button">
              {t("common.edit")}
            </Link>
          )}
          <MoreMenu label={t("summary.more")} items={menu.items} />
        </span>
      }
      footer={
        <div className="footer-stack">
          <div className="footer-row">
            {run === undefined && (
              <Link to={schedulePath(workout.id)} className="outline-button outline-button--wide">
                {t("plan.schedule")}
              </Link>
            )}
            {logButton}
            {missed && (
              <button
                type="button"
                className="outline-button outline-button--wide"
                onClick={() => setMoving(true)}
              >
                {t("plan.move")}
              </button>
            )}
          </div>
          {!missed && start !== null && <StartButton start={start} />}
        </div>
      }
    >
      <LibraryIntro
        workout={workout}
        {...(run?.block != null && { kicker: blockName(run.block) })}
        {...(run !== undefined && {
          day: <DayLine week={run.week} date={run.date} missed={missed} />,
        })}
      />
      {tiles.length > 0 && <SummaryTiles stats={tiles} />}
      {shown.items.length > 0 && (
        <section className="detail-section">
          <SectionHeading title={bodyHeading(shown.items)} />
          {next === undefined ? (
            <SessionTargetContext.Provider value={workout.targetRpe}>
              <BodyPreview
                items={shown.items}
                exerciseRestS={workout.exerciseRestS}
                unit={model.settings.units}
                kindOf={(exercise) => tally(exercise) ?? workout.kind}
                eachSide={eachSideOf(mine)}
                historyOf={(exercise) => exerciseHistoryPath(mine, exercise)}
              />
            </SessionTargetContext.Provider>
          ) : (
            <ProtocolPanel workout={next} gripId={gripId} />
          )}
        </section>
      )}
      {run === undefined && (
        <PlanList workoutId={workout.id} name={workout.name} kind={workout.kind} />
      )}
      {menu.sheets}
      {moving && run !== undefined && (
        <MoveSheet occurrence={run} name={workout.name} onClose={() => setMoving(false)} />
      )}
    </DetailFrame>
  );
}

export type WorkoutPageProps = {
  id: string;
  /** Opened from a planned run: its day, and Start and Log it for that run. */
  run?: RunOf | null;
};

/** A workout: what this session holds, how to start it, and where it is planned. */
export function WorkoutPage({ id, run = null }: WorkoutPageProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const locks = useLocks();
  const planned =
    run === null
      ? undefined
      : trainingDay(log, run.date, today).plans.find((o) => o.membership.id === run.membershipId);
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  if (locks.workout(workout)) return <Navigate to={joinPath("workout")} replace />;
  if (planned !== undefined && locks.day(planned.membership, workout))
    return <Navigate to={joinPath("plan_day")} replace />;
  return <Detail workout={workout} session={state.data.usage.get(id)?.count ?? 0} run={planned} />;
}
