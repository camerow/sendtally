import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { NEW_WORKOUT, protocolOf, type HangKind, type Workout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { copyName } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { useHangData } from "../data/HangDataContext";
import { PlannerSheet } from "../planner/PlannerSheet";
import type { PlannerRequest } from "../planner/types";
import { type } from "../type";
import { BuilderField } from "./BuilderField";
import { BuilderPreview } from "./BuilderPreview";
import { FIELDS, type NumberKey } from "./fields";

type Draft = Omit<Workout, "id" | "source">;

const MAX_PULL_REPS_ON_SWITCH = 12;

export type BuilderScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Customise: start from a copy of this library workout. */
  from?: string;
  /** Opened from planning: saving hands the workout to the planner, then goes back. */
  plan?: BuilderPlan;
};

export type BuilderPlan = Pick<
  Extract<PlannerRequest, { mode: "new" }>,
  "days" | "start" | "blockId"
>;

export function BuilderScreen({ id, from, plan }: BuilderScreenProps): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [planning, setPlanning] = React.useState<PlannerRequest | null>(null);
  const editing = id === undefined ? undefined : model.workout(id);
  const [draft, setDraft] = React.useState<Draft>(() => {
    const base = editing ?? (from === undefined ? undefined : model.workout(from));
    if (base === undefined) return NEW_WORKOUT;
    const fields = { ...protocolOf(base), grip: base.grip, timeUnits: base.timeUnits };
    return editing ? fields : { ...fields, name: copyName(base.name) };
  });
  const update = (patch: Partial<Draft>): void => setDraft((d) => ({ ...d, ...patch }));
  const setNumber = (key: NumberKey, value: number): void =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setKind = (kind: HangKind): void =>
    update(kind === "pull" && draft.reps > MAX_PULL_REPS_ON_SWITCH ? { kind, reps: 5 } : { kind });

  const store = (): string => {
    const workoutId = editing?.id ?? randomUUID();
    const name = draft.name.trim() || t("hang.untitledWorkout");
    void actions.saveWorkout({ ...draft, name, id: workoutId, source: "mine" });
    return workoutId;
  };
  const saveAndPlan = (): void => {
    const to = plan ?? { days: [], start: today };
    setPlanning({ mode: "new", workoutId: store(), gripId: null, ...to });
  };
  const save = (): void => {
    if (plan !== undefined) return saveAndPlan();
    const workoutId = store();
    if (editing) router.back();
    else router.replace({ pathname: "/workout/[id]", params: { id: workoutId } });
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
          paddingBottom: 6,
        }}
      >
        <Button label={t("hang.cancel")} onPress={() => router.back()} variant="link" height={44} />
        <Label color={colors.textSecondary}>
          {editing ? t("hang.editWorkout") : t("hang.newWorkout")}
        </Label>
        <Button
          label={plan === undefined ? t("hang.save") : t("plan.saveAndPlan")}
          onPress={save}
          variant="primary"
          height={40}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 18,
            paddingTop: 8,
            paddingHorizontal: 18,
            paddingBottom: 28,
          }}
        >
          <View style={{ gap: 6 }}>
            <Label small color={colors.textSecondary}>
              {t("hang.name")}
            </Label>
            <TextInput
              value={draft.name}
              onChangeText={(name) => update({ name })}
              placeholder={t("hang.namePlaceholder")}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t("hang.name")}
              maxLength={80}
              style={[
                type.display,
                {
                  height: 52,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  fontSize: 22,
                  color: colors.gunmetal,
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                },
              ]}
            />
          </View>
          <Segmented<HangKind>
            value={draft.kind}
            onChange={setKind}
            options={[
              { value: "hang", label: t("hang.kindHang") },
              { value: "pull", label: t("hang.kindPull") },
            ]}
          />
          <View>
            {FIELDS[draft.kind].map((spec) => {
              const hint = spec.hint?.(draft) ?? null;
              return (
                <BuilderField
                  key={spec.key}
                  spec={spec}
                  value={draft[spec.key]}
                  unit={spec.time ? draft.timeUnits[spec.key] : "s"}
                  hint={hint === null ? null : t(hint)}
                  onChange={(value) => setNumber(spec.key, value)}
                  onUnit={(unit) => update({ timeUnits: { ...draft.timeUnits, [spec.key]: unit } })}
                />
              );
            })}
          </View>
          <BuilderPreview protocol={draft} units={draft.timeUnits} />
          {plan === undefined && (
            <Button
              label={t("plan.saveAndPlan")}
              onPress={saveAndPlan}
              variant="outline"
              icon="schedule"
              height={50}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <PlannerSheet request={planning} onClose={() => router.back()} />
    </SafeAreaView>
  );
}
