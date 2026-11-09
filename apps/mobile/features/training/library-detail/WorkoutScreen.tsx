import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useActivities } from "@sendtally/features/activities";
import { tallyMeasuresOf } from "@sendtally/features/exercises";
import { hangWorkoutOf, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  occurrenceLink,
  trainingDay,
  useTrainingLog,
  type Occurrence,
} from "@sendtally/features/training";
import { workoutMinutes, type LibraryWorkout, type WorkoutUse } from "@sendtally/features/workouts";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { AddToSheet } from "../components/AddToSheet";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { HistoryList } from "../history/HistoryList";
import { activityItem, hangItem, ofWorkout } from "../history/historyItems";
import { useLibrary, useNextSession } from "../library/useLibrary";
import type { AddFlow } from "../planning/flowParams";
import { AddButton } from "../planning/AddButton";
import { useDayChanges } from "../plan-days/useDayChanges";
import { PlanList } from "../plans/PlanList";
import { startWorkout } from "../timer/startWorkout";
import { ProtocolPanel } from "../workout-detail/ProtocolPanel";
import { PreviewRow } from "./PreviewRow";
import { AddToPlanFooter } from "./AddToPlanFooter";
import { BodyPreview } from "./BodyPreview";
import { DayLine } from "./DayLine";
import { LibraryIntro } from "./LibraryIntro";
import { LogItButton } from "./LogItButton";
import { StartButton } from "./StartButton";
import { useWorkoutDetailActions } from "./useWorkoutDetailActions";
import { WorkoutOverTime } from "./WorkoutOverTime";

const openActivity = (id: string): void =>
  router.push({ pathname: "/activity/[id]", params: { id } });

/** A planned run a workout opens as: the day it lands on and the plan it is in. */
export type RunOf = { date: string; membershipId: string };

type DetailProps = {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
  grip: string | undefined;
  adding: AddFlow | null;
  run: Occurrence | undefined;
};

function Detail({ workout, use, grip, adding, run }: DetailProps): React.ReactElement {
  const api = useApi();
  const { model, today } = useHangData();
  const session = useNextSession(workout.id);
  const exercises = useExercises(api).state;
  const activities = useActivities(api).state;
  const { bar, addToBlock } = useWorkoutDetailActions(workout, { planned: run !== undefined });
  const hang = workout.kind === "hangboard" ? model.workout(workout.id) : undefined;
  const next = hang === undefined ? undefined : (hangWorkoutOf(workout, session) ?? hang);
  const gripId = grip ?? (hang === undefined ? "" : model.defaultGrip(hang));
  const changes = useDayChanges();
  const last = next === undefined ? null : model.lastUsed(next, gripId);
  const lastUsed =
    next === undefined || last === null
      ? undefined
      : t("hang.lastUsedValue", { setup: setupLabel(next.kind, last, model.settings.units) });

  const openExercise = (name: string): (() => void) | undefined => {
    const found =
      exercises.status === "ready"
        ? exercises.data.find((e) => exerciseKey(e.name) === exerciseKey(name))
        : undefined;
    return found === undefined
      ? undefined
      : () => router.push({ pathname: "/exercise/[id]", params: { id: found.id } });
  };
  const history =
    hang === undefined
      ? ofWorkout(activities.status === "ready" ? activities.data : [], workout.id).map((a) =>
          activityItem(a, model.settings.units)
        )
      : ofWorkout(model.sessions, workout.id).map((s) => hangItem(s, model));
  const planned =
    run === undefined
      ? undefined
      : { link: occurrenceLink(run), items: run.items, session: run.session };
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
    <StartButton workout={workout} date={run.date} planned={planned} height={54} />
  ) : hang === undefined ? (
    <StartButton workout={workout} date={today} height={54} />
  ) : (
    <Button
      label={t("hang.start")}
      onPress={() => startWorkout(workout.name, workout.id, gripId, session)}
      variant="primary"
      height={54}
      icon="play"
    />
  );
  const secondary =
    run === undefined ? (
      <AddToPlanFooter workoutId={workout.id}>{logIt}</AddToPlanFooter>
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
      logIt
    );

  return (
    <ScreenFrame
      overlay={addToBlock.toast && <Toast {...addToBlock.toast} />}
      action={adding === null && <DetailActions {...bar} />}
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
        use={use}
        {...(run !== undefined && run.block !== null && { kicker: run.block.name })}
        {...(run !== undefined && {
          day: <DayLine week={run.week} date={run.date} missed={missed} />,
        })}
      />
      <View style={{ gap: 8 }}>
        <Label color={colors.gunmetal}>{t("workouts.exercises")}</Label>
        {next === undefined ? (
          <BodyPreview
            workout={workout}
            unit={model.settings.units}
            session={use?.count ?? 0}
            tally={tallyMeasuresOf(
              exercises.status === "ready" ? exercises.data : [],
              workout.kind
            )}
            openExercise={openExercise}
          />
        ) : (
          <PreviewRow title={model.gripName(gripId)} detail="" note={lastUsed} />
        )}
      </View>
      {next !== undefined && (
        <ProtocolPanel workout={next} minutes={workoutMinutes(workout, session)} />
      )}
      <WorkoutOverTime workout={workout} gripId={hang === undefined ? null : gripId} />
      <HistoryList items={history} onOpen={openActivity} />
      <PlanList workoutId={workout.id} name={workout.name} kind={workout.kind} />
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

/** A workout: what it holds, how it is going, its past sessions and where it is planned. */
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
    <Detail
      workout={workout}
      use={state.data.usage.get(id)}
      grip={grip}
      adding={adding}
      run={planned}
    />
  );
}
