import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import type { Workout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../../components/BackButton";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { PlanList } from "../plans/PlanList";
import { PlannerSheet } from "../planner/PlannerSheet";
import type { PlannerRequest } from "../planner/types";
import { SessionEditorSheet } from "../session-editor/SessionEditorSheet";
import { startWorkout } from "../timer/startWorkout";
import { openTrends } from "../trends/openTrends";
import { GripLoadCard } from "./GripLoadCard";
import { ProtocolPanel } from "./ProtocolPanel";
import { WorkoutHistory } from "./WorkoutHistory";
import { WorkoutIntro } from "./WorkoutIntro";

function Detail({
  workout,
  initialGrip,
}: {
  workout: Workout;
  initialGrip?: string;
}): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [gripId, setGripId] = React.useState(initialGrip ?? model.defaultGrip(workout));
  const [picker, setPicker] = React.useState(false);
  const [planner, setPlanner] = React.useState<PlannerRequest | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const mine = workout.source === "mine";

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
              pathname: "/workout/builder",
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
        <WorkoutIntro workout={workout} />
        <GripLoadCard workout={workout} gripId={gripId} onChooseGrip={() => setPicker(true)} />
        <ProtocolPanel workout={workout} />
        <View style={{ gap: 8 }}>
          <Label color={colors.gunmetal}>{t("hang.schedule")}</Label>
          <PlanList
            workoutId={workout.id}
            empty={t("hang.notScheduled")}
            showName={false}
            onOpen={(schedule) => setPlanner({ mode: "edit", schedule })}
          />
          <Button
            label={t("hang.addToSchedule")}
            onPress={() =>
              setPlanner({ mode: "new", workoutId: workout.id, gripId, days: [], start: today })
            }
            variant="dashed"
            icon="plus"
            height={50}
          />
        </View>
        <WorkoutHistory
          workoutId={workout.id}
          onOpen={setEditing}
          onTrends={() => openTrends(workout.id, gripId)}
        />
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
        <Button
          label={t("hang.start")}
          onPress={() => startWorkout(workout.id, gripId)}
          variant="primary"
          height={54}
          icon="play"
        />
      </View>
      <GripPickerSheet
        visible={picker}
        workout={workout}
        multi={false}
        selected={[gripId]}
        onPick={chooseGrip}
        onClose={() => setPicker(false)}
      />
      <PlannerSheet request={planner} onClose={() => setPlanner(null)} />
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
  const workout = model.workout(id);
  return workout === undefined ? null : <Detail workout={workout} initialGrip={grip} />;
}
