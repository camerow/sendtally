import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { seriesFor, summarise, type HangWorkout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  copyName,
  draftOf,
  useWorkoutActions,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { BackButton } from "../../../components/BackButton";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { confirmDeleteWorkout } from "../library-detail/confirmDeleteWorkout";
import { useLibrary } from "../library/useLibrary";
import { PlanList } from "../plans/PlanList";
import { SessionEditorSheet } from "../session-editor/SessionEditorSheet";
import { startWorkout } from "../timer/startWorkout";
import { TrendCard } from "../trends/TrendCard";
import { GripSetupCard } from "./GripSetupCard";
import { ProtocolPanel } from "./ProtocolPanel";
import { WorkoutHistory } from "./WorkoutHistory";
import { WorkoutIntro } from "./WorkoutIntro";
import { AddToPlanFooter } from "../library-detail/AddToPlanFooter";

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

function Detail({
  workout,
  library,
  initialGrip,
}: {
  workout: HangWorkout;
  library: LibraryWorkout;
  initialGrip?: string;
}): React.ReactElement {
  const { model, actions, today } = useHangData();
  const workouts = useWorkoutActions(useApi(), reportFailure);
  const [gripId, setGripId] = React.useState(initialGrip ?? model.defaultGrip(workout));
  const [picker, setPicker] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const mine = workout.source === "mine";
  const series = seriesFor(model.sessions, workout.id, gripId);
  const summary = summarise(series, today);

  const duplicate = (): void => {
    const id = randomUUID();
    void workouts.saveWorkout(id, { ...draftOf(library), name: copyName(workout.name) });
    router.push({ pathname: "/workout/[id]", params: { id } });
  };
  const remove = (): void =>
    confirmDeleteWorkout(workout.name, t("workouts.deleteHangBody"), () => {
      router.back();
      void workouts.deleteWorkout(workout.id);
    });

  const chooseGrip = (id: string): void => {
    setGripId(id);
    void actions.setDefaultGrip(workout.id, id);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingTop: 6,
        }}
      >
        <BackButton />
        <Button
          label={mine ? t("hang.edit") : t("hang.customise")}
          onPress={() =>
            router.push({
              pathname: "/workout/edit",
              params: mine ? { id: workout.id } : { from: workout.id },
            })
          }
          variant="outline"
          height={40}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingTop: 8, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        <WorkoutIntro workout={workout} description={library.description} />
        <GripSetupCard workout={workout} gripId={gripId} onChooseGrip={() => setPicker(true)} />
        <ProtocolPanel workout={workout} />
        <View style={{ gap: 8 }}>
          <Label color={colors.gunmetal}>{t("hang.schedule")}</Label>
          <PlanList workoutId={workout.id} name={workout.name} empty={t("hang.notScheduled")} />
        </View>
        {summary !== null && (
          <TrendCard
            workout={workout.name}
            grip={model.gripName(gripId)}
            series={series}
            summary={summary}
            kind={workout.kind}
            unit={model.settings.units}
          />
        )}
        <WorkoutHistory workoutId={workout.id} onOpen={setEditing} />
        <View style={{ gap: 8 }}>
          <Button
            label={t("workouts.duplicate")}
            onPress={duplicate}
            variant="outline"
            height={50}
          />
          {mine && (
            <Button label={t("workouts.delete")} onPress={remove} variant="danger" height={50} />
          )}
        </View>
      </ScrollView>
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 18,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
        }}
      >
        <AddToPlanFooter workoutId={workout.id}>
          <Button
            label={t("hang.start")}
            onPress={() => startWorkout(workout.id, gripId)}
            variant="primary"
            height={54}
            icon="play"
            style={{ flex: 1 }}
          />
        </AddToPlanFooter>
      </View>
      <GripPickerSheet
        visible={picker}
        workout={workout}
        multi={false}
        selected={[gripId]}
        onPick={chooseGrip}
        onClose={() => setPicker(false)}
      />
      <SessionEditorSheet sessionId={editing} onClose={() => setEditing(null)} />
    </SafeAreaView>
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
