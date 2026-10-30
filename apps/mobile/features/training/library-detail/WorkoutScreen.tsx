import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useActivities } from "@sendtally/features/activities";
import { tallyMeasuresOf } from "@sendtally/features/exercises";
import { hangWorkoutOf } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import { workoutMinutes, type LibraryWorkout, type WorkoutUse } from "@sendtally/features/workouts";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { HistoryList } from "../history/HistoryList";
import { activityItem, hangItem, ofWorkout } from "../history/historyItems";
import { useLibrary, useNextSession } from "../library/useLibrary";
import { addFlowParams, type AddFlow } from "../planning/flowParams";
import { PlanList } from "../plans/PlanList";
import { startWorkout } from "../timer/startWorkout";
import { GripSetupCard } from "../workout-detail/GripSetupCard";
import { ProtocolPanel } from "../workout-detail/ProtocolPanel";
import { AddToPlanFooter } from "./AddToPlanFooter";
import { BodyPreview } from "./BodyPreview";
import { LibraryIntro } from "./LibraryIntro";
import { LogItButton } from "./LogItButton";
import { StartButton } from "./StartButton";
import { useWorkoutDetailActions } from "./useWorkoutDetailActions";
import { WorkoutOverTime } from "./WorkoutOverTime";

const openActivity = (id: string): void =>
  router.push({ pathname: "/activity/[id]", params: { id } });

type DetailProps = {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
  grip: string | undefined;
  adding: AddFlow | null;
};

function Detail({ workout, use, grip, adding }: DetailProps): React.ReactElement {
  const api = useApi();
  const { model, today, actions } = useHangData();
  const session = useNextSession(workout.id);
  const exercises = useExercises(api).state;
  const activities = useActivities(api).state;
  const detailActions = useWorkoutDetailActions(workout);
  const hang = workout.kind === "hangboard" ? model.workout(workout.id) : undefined;
  const next = hang === undefined ? undefined : (hangWorkoutOf(workout, session) ?? hang);
  const [gripId, setGripId] = React.useState(
    grip ?? (hang === undefined ? "" : model.defaultGrip(hang))
  );
  const [picker, setPicker] = React.useState(false);

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
  const start =
    hang === undefined ? (
      <StartButton workout={workout} date={today} height={54} style={{ flex: 1 }} />
    ) : (
      <Button
        label={t("hang.start")}
        onPress={() => startWorkout(workout.name, workout.id, gripId, session)}
        variant="primary"
        height={54}
        icon="play"
        style={{ flex: 1 }}
      />
    );

  return (
    <ScreenFrame
      action={adding === null && <DetailActions {...detailActions} />}
      footer={
        adding === null ? (
          <View style={{ gap: 8 }}>
            <AddToPlanFooter workoutId={workout.id}>{start}</AddToPlanFooter>
            <LogItButton
              workout={workout}
              date={today}
              label={t("workouts.logItWithoutTimer")}
              gripId={hang === undefined ? undefined : gripId}
              height={48}
            />
          </View>
        ) : (
          <Button
            label={t("plan.addToPlan")}
            onPress={() =>
              router.push({
                pathname: "/plan/schedule",
                params: { workoutId: workout.id, ...addFlowParams(adding) },
              })
            }
            variant="primary"
            height={54}
            icon="plus"
          />
        )
      }
    >
      <LibraryIntro workout={workout} use={use} />
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
          <>
            <GripSetupCard workout={next} gripId={gripId} onChooseGrip={() => setPicker(true)} />
            <ProtocolPanel workout={next} minutes={workoutMinutes(workout, session)} />
          </>
        )}
      </View>
      <WorkoutOverTime workout={workout} gripId={hang === undefined ? null : gripId} />
      <HistoryList items={history} onOpen={openActivity} />
      <PlanList workoutId={workout.id} name={workout.name} />
      {hang !== undefined && (
        <GripPickerSheet
          visible={picker}
          workout={hang}
          multi={false}
          selected={[gripId]}
          onPick={(id) => {
            setGripId(id);
            void actions.setDefaultGrip(workout.id, id);
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </ScreenFrame>
  );
}

export type WorkoutScreenProps = {
  id: string;
  grip?: string;
  /** Opened while adding to the plan: its footer goes on to when, and it cannot be changed here. */
  adding?: AddFlow | null;
};

/** A workout: what it holds, how it is going, its past sessions and where it is planned. */
export function WorkoutScreen({
  id,
  grip,
  adding = null,
}: WorkoutScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;
  const workout = state.data.workout(id);
  return workout === undefined ? null : (
    <Detail workout={workout} use={state.data.usage.get(id)} grip={grip} adding={adding} />
  );
}
