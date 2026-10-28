import { router } from "expo-router";
import React from "react";
import { Alert, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { patternText } from "@sendtally/features/training";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { Button } from "../components/Button";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { BodyPreview } from "../library-detail/BodyPreview";
import { LibraryIntro } from "../library-detail/LibraryIntro";
import { StartButton } from "../library-detail/StartButton";
import { useLibrary } from "../library/useLibrary";
import { type } from "../type";
import { addFlowParams, type AddFlow } from "./flowParams";
import { ScreenFrame } from "./ScreenFrame";

export type WorkoutPreviewScreenProps = {
  id: string;
  /** Opened while adding to the plan: Add goes on to when, else it can be started or edited. */
  adding: AddFlow | null;
};

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

/** A workout read through before it is planned or run: what it holds and how it takes turns. */
export function WorkoutPreviewScreen({
  id,
  adding,
}: WorkoutPreviewScreenProps): React.ReactElement | null {
  const { model, today } = useHangData();
  const { state, reload } = useLibrary();
  const actions = useWorkoutActions(useApi(), reportFailure);
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  const mine = workout.source === "mine";
  const remove = (): void =>
    confirmDestructive({
      title: t("workouts.deleteTitle", { name: workout.name }),
      body: t("workouts.deleteBody"),
      action: t("common.delete"),
      onConfirm: () => {
        router.back();
        void actions.deleteWorkout(workout.id);
      },
    });

  return (
    <ScreenFrame
      action={
        adding === null && (
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
        )
      }
      footer={
        adding === null ? (
          <StartButton workout={workout} date={today} height={54} />
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
      <LibraryIntro workout={workout} use={state.data.usage.get(id)} />
      <BodyPreview workout={workout} unit={model.settings.units} />
      {workout.variations.length > 1 && (
        <Text style={[type.mono, { fontSize: 12, lineHeight: 18, color: colors.textSecondary }]}>
          {t("plan.takesTurns", { pattern: patternText(workout) })}
        </Text>
      )}
      {mine && adding === null && (
        <Button label={t("workouts.delete")} onPress={remove} variant="danger" height={50} />
      )}
    </ScreenFrame>
  );
}
