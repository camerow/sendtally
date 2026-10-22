import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  copyName,
  draftOf,
  useWorkoutActions,
  type LibraryWorkout,
  type WorkoutUse,
} from "@sendtally/features/workouts";
import { BackButton } from "../../../components/BackButton";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { useHangData } from "../data/HangDataContext";
import { PlanList } from "../plans/PlanList";
import { BodyPreview } from "./BodyPreview";
import { confirmDeleteWorkout } from "./confirmDeleteWorkout";
import { LibraryIntro } from "./LibraryIntro";
import { startLibraryWorkout } from "./startLibraryWorkout";

export type LibraryWorkoutScreenProps = { workout: LibraryWorkout; use: WorkoutUse | undefined };

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

/** A workout other than a hangboard one: what it holds, where it is planned, and starting or changing it. */
export function LibraryWorkoutScreen({
  workout,
  use,
}: LibraryWorkoutScreenProps): React.ReactElement {
  const { model, today } = useHangData();
  const actions = useWorkoutActions(useApi(), reportFailure);
  const mine = workout.source === "mine";

  const duplicate = (): void => {
    const draft = draftOf(workout);
    const id = randomUUID();
    void actions.saveWorkout(id, { ...draft, name: copyName(draft.name) });
    router.push({ pathname: "/workout/[id]", params: { id } });
  };
  const remove = (): void =>
    confirmDeleteWorkout(workout.name, t("workouts.deleteBody"), () => {
      router.back();
      void actions.deleteWorkout(workout.id);
    });

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
          height={44}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 20, paddingTop: 8, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        <LibraryIntro workout={workout} use={use} />
        <BodyPreview workout={workout} unit={model.settings.units} />
        <PlanList workoutId={workout.id} name={workout.name} empty={t("hang.notScheduled")} />
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
        <Button
          label={t("hang.start")}
          onPress={() => startLibraryWorkout(workout, today)}
          variant="primary"
          height={54}
          icon="play"
        />
      </View>
    </SafeAreaView>
  );
}
