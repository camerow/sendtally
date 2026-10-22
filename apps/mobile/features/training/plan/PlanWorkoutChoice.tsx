import { randomUUID } from "expo-crypto";
import React from "react";
import { Alert, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { templateOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { bodySummary, useWorkoutActions } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { SheetSection } from "../components/SheetSection";
import { CategoryMark } from "../library/CategoryMark";
import { LibraryPickerSheet } from "../library/LibraryPickerSheet";
import { MineBadge } from "../library/MineBadge";
import { type } from "../type";
import { withWorkout } from "./planItemDraft";
import type { PlanItemForm } from "./usePlanItemForm";

export type PlanWorkoutChoiceProps = { form: PlanItemForm };

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

/** The library workout a plan runs, a way to pick one, and saving its own template as one. */
export function PlanWorkoutChoice({ form }: PlanWorkoutChoiceProps): React.ReactElement {
  const actions = useWorkoutActions(useApi(), reportFailure);
  const [picking, setPicking] = React.useState(false);
  const { draft, workout, update } = form;
  const template = draft.kind === "climb" ? null : templateOf(draft.template);

  const saveAsWorkout = (): void => {
    if (template === null) return;
    const id = randomUUID();
    void actions.saveWorkout(id, {
      name: draft.title.trim() || t("hang.untitledWorkout"),
      category: draft.kind,
      description: null,
      tags: [],
      minutes: draft.minutes,
      targetRpe: draft.targetRpe,
      body: template,
    });
    update({ workoutId: id });
  };

  return (
    <SheetSection
      label={t("workouts.workout")}
      aside={
        draft.workoutId !== null && (
          <Button
            label={t("workouts.unlink")}
            onPress={() => update({ workoutId: null })}
            variant="link"
            height={44}
          />
        )
      }
    >
      {workout !== undefined && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.surfaceSoft,
          }}
        >
          <CategoryMark category={workout.category} size={32} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
              {workout.name}
            </Text>
            {bodySummary(workout) !== null && (
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                {bodySummary(workout)}
              </Text>
            )}
          </View>
          {workout.source === "mine" && <MineBadge />}
        </View>
      )}
      <Button
        label={draft.workoutId === null ? t("workouts.chooseFromLibrary") : t("hang.change")}
        onPress={() => setPicking(true)}
        variant="outline"
        icon="plus"
        height={48}
      />
      {draft.workoutId === null && template !== null && (
        <Button
          label={t("workouts.saveAsWorkout")}
          onPress={saveAsWorkout}
          variant="link"
          height={44}
        />
      )}
      {picking && (
        <LibraryPickerSheet
          title={t("workouts.chooseWorkout")}
          categories={[draft.kind]}
          onClose={(w) => {
            setPicking(false);
            if (w !== null) update(withWorkout(w));
          }}
        />
      )}
    </SheetSection>
  );
}
