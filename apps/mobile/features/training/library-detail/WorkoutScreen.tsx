import { router } from "expo-router";
import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { eachSideOf, tallyMeasuresOf } from "@sendtally/features/exercises";
import { hangWorkoutOf, useGrips } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import {
  trainingDay,
  useTrainingLog,
  type Occurrence,
  plannedItems,
  blockName,
} from "@sendtally/features/training";
import { bodyHeading, workoutMinutes, type LibraryWorkout } from "@sendtally/features/workouts";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { AddToSheet } from "../components/AddToSheet";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { openExerciseHistory } from "../exercises/openExerciseHistory";
import { useLibrary, useNextSession } from "../library/useLibrary";
import type { AddFlow } from "@sendtally/features/training";
import { AddButton } from "../planning/AddButton";
import { useDayChanges } from "../plan-days/useDayChanges";
import { PlanList } from "../plans/PlanList";
import { startWorkout } from "../timer/startWorkout";
import { SummaryTiles } from "../summary/SummaryTiles";
import { ProtocolPanel } from "../workout-detail/ProtocolPanel";
import { ScheduleFooter } from "./ScheduleFooter";
import { BodyPreview } from "./BodyPreview";
import { DayLine } from "./DayLine";
import { LibraryIntro } from "./LibraryIntro";
import { LogItButton } from "./LogItButton";
import { StartButton } from "./StartButton";
import { usePlannedItems } from "./usePlannedItems";
import { useWorkoutDetailActions } from "./useWorkoutDetailActions";
import { SessionTargetContext } from "../sets/sessionTarget";

/** A planned run a workout opens as: the day it lands on and the plan it is in. */
export type RunOf = { date: string; membershipId: string };

type DetailProps = {
  workout: LibraryWorkout;
  grip: string | undefined;
  adding: AddFlow | null;
  run: Occurrence | undefined;
};

function Detail({ workout, grip, adding, run }: DetailProps): React.ReactElement {
  const api = useApi();
  const { isGrip } = useGrips(api);
  const { model, today } = useHangData();
  const session = useNextSession(workout.id);
  const exercises = useExercises(api).state;
  const mine = exercises.status === "ready" ? exercises.data : [];
  const { bar, addToBlock } = useWorkoutDetailActions(workout, { planned: run !== undefined });
  const hang = workout.kind === "hangboard" ? model.workout(workout.id) : undefined;
  const next = hang === undefined ? undefined : (hangWorkoutOf(workout, session) ?? hang);
  const gripId = grip ?? (hang === undefined ? "" : model.defaultGrip(hang));
  const changes = useDayChanges();
  const planned = run === undefined ? undefined : plannedItems(run);
  const shown = usePlannedItems(workout, planned);
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

  const openExercise = (name: string): (() => void) | undefined => openExerciseHistory(mine, name);
  const missed = run?.status === "missed";
  const logIt = (
    <LogItButton
      workout={workout}
      date={run?.date ?? today}
      label={t("workouts.logIt")}
      planned={planned}
      gripId={hang === undefined || run !== undefined ? undefined : gripId}
      height={48}
      style={{ flex: 1 }}
    />
  );
  const start = missed ? null : run !== undefined ? (
    <StartButton workout={workout} date={run.date} planned={planned} ownPage height={54} />
  ) : hang === undefined ? (
    <StartButton workout={workout} date={today} ownPage height={54} />
  ) : (
    <Button
      label={t("hang.start")}
      onPress={() =>
        startWorkout(workout.name, workout.id, gripId, session, undefined, router.replace)
      }
      variant="primary"
      height={54}
      icon="play"
    />
  );
  const secondary =
    run === undefined ? (
      <ScheduleFooter workoutId={workout.id}>{logIt}</ScheduleFooter>
    ) : missed ? (
      <View style={{ flexDirection: "row", gap: 10 }}>
        {logIt}
        <Button
          label={t("plan.move")}
          onPress={() => changes.open("move", run, workout.name)}
          variant="outline"
          height={48}
          style={{ flex: 1 }}
        />
      </View>
    ) : (
      <View style={{ flexDirection: "row" }}>{logIt}</View>
    );

  return (
    <ScreenFrame
      overlay={addToBlock.toast && <Toast {...addToBlock.toast} />}
      hero={libraryPictures("workout", workout.id)}
      action={
        adding === null && (
          <DetailActions
            {...bar}
            onHistory={() =>
              router.push({ pathname: "/workout/history", params: { id: workout.id } })
            }
          />
        )
      }
      footer={
        adding === null ? (
          <View style={{ gap: 8 }}>
            {secondary}
            {start}
          </View>
        ) : (
          <AddButton flow={adding} workoutId={workout.id} />
        )
      }
    >
      <LibraryIntro
        workout={workout}
        {...(run !== undefined && run.block !== null && { kicker: blockName(run.block) })}
        {...(run !== undefined && {
          day: <DayLine week={run.week} date={run.date} missed={missed} />,
        })}
      />
      {tiles.length > 0 && <SummaryTiles stats={tiles} />}
      {shown.items.length > 0 && (
        <View style={{ gap: 8 }}>
          <Label color={colors.gunmetal}>{bodyHeading(shown.items)}</Label>
          {next === undefined ? (
            <SessionTargetContext.Provider value={workout.targetRpe}>
              <BodyPreview
                items={shown.items}
                exerciseRestS={workout.exerciseRestS}
                unit={model.settings.units}
                kindOf={(exercise) => tally(exercise) ?? workout.kind}
                eachSide={eachSideOf(mine)}
                openExercise={openExercise}
              />
            </SessionTargetContext.Provider>
          ) : (
            <ProtocolPanel workout={next} gripId={gripId} />
          )}
        </View>
      )}
      {run === undefined && (
        <PlanList workoutId={workout.id} name={workout.name} kind={workout.kind} />
      )}
      {changes.sheets}
      {addToBlock.sheet && <AddToSheet {...addToBlock.sheet} />}
    </ScreenFrame>
  );
}

export type WorkoutScreenProps = {
  id: string;
  grip?: string;
  /** Opened while adding to the plan: its footer goes on to when, and it cannot be changed here. */
  adding?: AddFlow | null;
  /** Opened from a planned run: its day, and Start and Log it for that run. */
  run?: RunOf | null;
};

/** A workout: what this session holds, how to start it, and where it is planned. */
export function WorkoutScreen({
  id,
  grip,
  adding = null,
  run = null,
}: WorkoutScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const planned =
    run === null
      ? undefined
      : trainingDay(log, run.date, today).plans.find((o) => o.membership.id === run.membershipId);
  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;
  const workout = state.data.workout(id);
  return workout === undefined ? null : (
    <Detail workout={workout} grip={grip} adding={adding} run={planned} />
  );
}
