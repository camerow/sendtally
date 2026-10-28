import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ActivityRecord } from "@sendtally/api-client";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { DEFAULT_EXERCISE_REST_S, type ItemDone } from "@sendtally/core/hang";
import {
  activityFromDraft,
  kindLabel,
  parseMinutes,
  setText,
  stepMinutes,
  trainingLoadLabel,
  useActivityActions,
  useWeightUnit,
  type ActivityDraft,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { DateTimeField } from "../../../components/DateTimeField";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EffortField } from "../components/EffortField";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { Title } from "../components/Title";
import { PreviewRow } from "../library-detail/PreviewRow";
import { type } from "../type";
import { ActivityPostBar } from "./ActivityPostBar";
import { KindChips } from "./KindChips";
import { confirmDestructive } from "../../../lib/confirmDestructive";

export type ActivityFormProps = {
  id: string;
  initial: ActivityDraft;
  /** The activity as logged, which can be deleted and posted to Strava; null while logging a new one. */
  logged: ActivityRecord | null;
};

const input = {
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
  paddingHorizontal: 13,
  paddingVertical: 12,
} as const;

const reportFailure = (): void => Alert.alert(t("activities.saveFailed"));

/** What was done as a workout to run again: each item's first set, as many times as it was done. */
const itemsOf = (done: readonly ItemDone[]) =>
  done
    .filter((d) => d.sets.length > 0)
    .map((d) => ({ exercise: d.exercise, dose: { ...d.sets[0], sets: d.sets.length } }));

/** Log or edit one activity: kind, title, when, how long, how hard, its sets or checklist, and its training load. */
export function ActivityForm({ id, initial, logged }: ActivityFormProps): React.ReactElement {
  const api = useApi();
  const actions = useActivityActions(api, reportFailure);
  const [draft, setDraft] = React.useState(initial);
  const update = (patch: Partial<ActivityDraft>): void => setDraft((d) => ({ ...d, ...patch }));
  const load = trainingLoadLabel(draft);
  const unit = useWeightUnit(api);
  const workouts = useWorkoutActions(api, reportFailure);
  const items = itemsOf(draft.done);

  const saveAsWorkout = (): void => {
    if (items.length === 0) return;
    const workoutId = randomUUID();
    void workouts.saveWorkout(workoutId, {
      kind: draft.kind,
      name: draft.title.trim() || kindLabel(draft.kind),
      description: "",
      minutes: draft.minutes,
      targetRpe: draft.rpe,
      variations: [{ label: "", items }],
      pattern: [0],
      exerciseRestS: DEFAULT_EXERCISE_REST_S,
    });
    router.push({ pathname: "/workout/[id]", params: { id: workoutId } });
  };
  const save = (): void => {
    void actions.saveActivity(activityFromDraft(id, draft));
    router.back();
  };
  const remove = (): void =>
    confirmDestructive({
      title: t("activities.deleteTitle"),
      body:
        logged === null || logged.stravaActivityId === null
          ? t("activities.deleteBody")
          : t("activities.deleteBodyStrava"),
      action: t("common.delete"),
      onConfirm: () => {
        router.back();
        void actions.deleteActivity(id);
      },
    });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 32,
          gap: 18,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Title size={28}>
            {logged !== null ? t("activities.editActivity") : t("activities.logActivity")}
          </Title>
          <Button label={t("common.cancel")} onPress={() => router.back()} variant="link" />
        </View>

        <KindChips value={draft.kind} onChange={(kind) => update({ kind })} />

        <SheetSection label={t("activities.title")}>
          <TextInput
            testID="activity-title"
            value={draft.title}
            maxLength={80}
            placeholder={kindLabel(draft.kind)}
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t("activities.title")}
            onChangeText={(title) => update({ title })}
            style={input}
          />
        </SheetSection>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SheetSection label={t("activities.date")}>
              <DateTimeField
                testID="activity-date"
                mode="date"
                value={draft.date}
                label={t("activities.date")}
                onChange={(date) => update({ date })}
              />
            </SheetSection>
          </View>
          <View style={{ flex: 1 }}>
            <SheetSection label={t("activities.startTime")}>
              <DateTimeField
                testID="activity-time"
                mode="time"
                value={draft.startTime}
                label={t("activities.startTime")}
                placeholder={t("activities.anyTime")}
                onChange={(startTime) => update({ startTime })}
                onClear={() => update({ startTime: "" })}
              />
            </SheetSection>
          </View>
        </View>

        <SheetSection label={t("activities.durationMinutes")}>
          <Stepper
            value={String(draft.minutes)}
            onCommit={(text) => {
              const minutes = parseMinutes(text);
              if (minutes !== null) update({ minutes });
            }}
            onStep={(direction) => update({ minutes: stepMinutes(draft.minutes, direction) })}
            label={t("activities.durationMinutes")}
            decreaseLabel={t("activities.fewerMinutes")}
            increaseLabel={t("activities.moreMinutes")}
            surface="plain"
            keyboard="number-pad"
          />
        </SheetSection>

        <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />

        {items.length > 0 && (
          <SheetSection label={t("activities.details")}>
            {draft.done.map((d) => (
              <PreviewRow
                key={d.item}
                title={d.exercise}
                detail={d.sets.map((set) => setText(set, unit) || "✓").join("  /  ")}
              />
            ))}
          </SheetSection>
        )}

        <SheetSection label={t("common.notes")}>
          <TextInput
            testID="activity-notes"
            value={draft.notes}
            multiline
            maxLength={2000}
            placeholder={t("common.notesPlaceholder")}
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t("common.notes")}
            onChangeText={(notes) => update({ notes })}
            style={{ ...input, minHeight: 96, lineHeight: 22, textAlignVertical: "top" }}
          />
        </SheetSection>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: radius.control,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.lineOnLightStrong,
          }}
        >
          <Text style={[type.body, { fontSize: 14, color: colors.gunmetal }]}>
            {t("activities.trainingLoad")}
          </Text>
          <Text
            style={[
              load === null ? type.body : type.monoBold,
              { fontSize: 14, color: load === null ? colors.textMuted : colors.gunmetal },
            ]}
          >
            {load ?? t("activities.loadNeedsEffort")}
          </Text>
        </View>

        {logged !== null && <ActivityPostBar activity={logged} />}

        <View style={{ gap: 6 }}>
          <Button label={t("common.save")} onPress={save} variant="primary" height={54} />
          {logged !== null && items.length > 0 && (
            <Button label={t("workouts.saveAsWorkout")} onPress={saveAsWorkout} variant="link" />
          )}
          {logged !== null && (
            <Button label={t("activities.deleteActivity")} onPress={remove} variant="danger" />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
