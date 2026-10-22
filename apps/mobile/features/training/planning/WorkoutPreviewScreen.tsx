import { router } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { patternText } from "@sendtally/features/training";
import { Button } from "../components/Button";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { BodyPreview } from "../library-detail/BodyPreview";
import { LibraryIntro } from "../library-detail/LibraryIntro";
import { startLibraryWorkout } from "../library-detail/startLibraryWorkout";
import { useLibrary } from "../library/useLibrary";
import { type } from "../type";
import { addFlowParams, type AddFlow } from "./flowParams";
import { ScreenFrame } from "./ScreenFrame";

export type WorkoutPreviewScreenProps = {
  id: string;
  /** Opened while adding to the plan: Add goes on to when, else it can be started or edited. */
  adding: AddFlow | null;
};

/** A workout read through before it is planned or run: what it holds and how it takes turns. */
export function WorkoutPreviewScreen({
  id,
  adding,
}: WorkoutPreviewScreenProps): React.ReactElement | null {
  const { model, today } = useHangData();
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  const mine = workout.source === "mine";

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
          <Button
            label={t("hang.start")}
            onPress={() => startLibraryWorkout(workout, today)}
            variant="primary"
            height={54}
            icon="play"
          />
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
    </ScreenFrame>
  );
}
