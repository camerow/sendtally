import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { HangWorkout } from "@sendtally/core/hang";
import { hangWorkoutOf } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { LinkRow } from "../../../components/LinkRow";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { AddToPlanFooter } from "../library-detail/AddToPlanFooter";
import { useWorkoutDetailActions } from "../library-detail/useWorkoutDetailActions";
import { useLibrary, useNextSession } from "../library/useLibrary";
import { PlanList } from "../plans/PlanList";
import { startWorkout } from "../timer/startWorkout";
import { GripSetupCard } from "./GripSetupCard";
import { ProtocolPanel } from "./ProtocolPanel";
import { WorkoutHistory } from "./WorkoutHistory";
import { WorkoutIntro } from "./WorkoutIntro";

function Detail({
  workout,
  library,
  initialGrip,
}: {
  workout: HangWorkout;
  library: LibraryWorkout;
  initialGrip?: string;
}): React.ReactElement {
  const { model, actions } = useHangData();
  const session = useNextSession(workout.id);
  const next = hangWorkoutOf(library, session) ?? workout;
  const detailActions = useWorkoutDetailActions(library);
  const [gripId, setGripId] = React.useState(initialGrip ?? model.defaultGrip(workout));
  const [picker, setPicker] = React.useState(false);
  const onGrip = model.sessions.some((s) => s.gripId === gripId);

  const chooseGrip = (id: string): void => {
    setGripId(id);
    void actions.setDefaultGrip(workout.id, id);
  };

  return (
    <ScreenFrame
      action={<DetailActions {...detailActions} />}
      footer={
        <AddToPlanFooter workoutId={workout.id}>
          <Button
            label={t("hang.start")}
            onPress={() => startWorkout(workout.id, gripId, session)}
            variant="primary"
            height={54}
            icon="play"
            style={{ flex: 1 }}
          />
        </AddToPlanFooter>
      }
    >
      <WorkoutIntro workout={workout} description={library.description} focus={library.focus} />
      <GripSetupCard workout={next} gripId={gripId} onChooseGrip={() => setPicker(true)} />
      <ProtocolPanel workout={next} />
      <View style={{ gap: 8 }}>
        <Label color={colors.gunmetal}>{t("hang.schedule")}</Label>
        <PlanList workoutId={workout.id} name={workout.name} empty={t("hang.notScheduled")} />
      </View>
      {onGrip && (
        <LinkRow
          label={t("hang.gripProgress", { grip: model.gripName(gripId) })}
          onPress={() => router.push({ pathname: "/grip/[id]", params: { id: gripId } })}
        />
      )}
      <WorkoutHistory
        workoutId={workout.id}
        onOpen={(id) => router.push({ pathname: "/activity/[id]", params: { id } })}
      />
      <GripPickerSheet
        visible={picker}
        workout={workout}
        multi={false}
        selected={[gripId]}
        onPick={chooseGrip}
        onClose={() => setPicker(false)}
      />
    </ScreenFrame>
  );
}

export type WorkoutDetailScreenProps = { id: string; grip?: string };

export function WorkoutDetailScreen({
  id,
  grip,
}: WorkoutDetailScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const library = useLibrary().state;
  const workout = model.workout(id);
  const base = library.status === "ready" ? library.data.workout(id) : undefined;
  return workout === undefined || base === undefined ? null : (
    <Detail workout={workout} library={base} initialGrip={grip} />
  );
}
