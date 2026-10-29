import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import type { ActivityRecord } from "@sendtally/api-client";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { defaultExerciseRestS, type ItemDone } from "@sendtally/core/hang";
import {
  activityFromDraft,
  kindLabel,
  minutesOf,
  useActivityActions,
  useWeightUnit,
  type ActivityDraft,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { DateTimeField } from "../../../components/DateTimeField";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { TimeField } from "../../../components/TimeField";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EffortField } from "../components/EffortField";
import { FocusField } from "../components/FocusField";
import { SheetSection } from "../components/SheetSection";
import { Title } from "../components/Title";
import { type } from "../type";
import { DoneDetails } from "./DoneDetails";
import { KindChips } from "./KindChips";

export type ActivityFormProps = {
  id: string;
  initial: ActivityDraft;
  /** The activity as logged; null while logging a new one. */
  logged: ActivityRecord | null;
  /** A player ran it: its start and length are already known, so only the date shows. */
  timed?: boolean;
  /** It came with a kind, from a workout; a logged activity always has one. */
  kindSet?: boolean;
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

/** Log or edit one activity: kind, title, when, how long, how hard, its focus, and its sets or checklist. Save sits in the header. */
export function ActivityForm({
  id,
  initial,
  logged,
  timed = false,
  kindSet = false,
}: ActivityFormProps): React.ReactElement {
  const api = useApi();
  const actions = useActivityActions(api, reportFailure);
  const [draft, setDraft] = React.useState(initial);
  const update = (patch: Partial<ActivityDraft>): void => setDraft((d) => ({ ...d, ...patch }));
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
      items: items.map(({ exercise, dose }) => ({ exercise, doses: [dose] })),
      exerciseRestS: defaultExerciseRestS(draft.kind),
      focus: draft.focus,
    });
    router.push({ pathname: "/workout/[id]", params: { id: workoutId } });
  };
  const save = (): void => {
    void actions.saveActivity(activityFromDraft(id, draft));
    router.back();
  };
  const name = draft.title.trim() || kindLabel(draft.kind);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
        }}
      >
        <Button label={t("common.cancel")} onPress={() => router.back()} variant="muted" />
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {logged !== null ? t("summary.editWorkout") : t("activities.logActivity")}
        </Text>
        <Button label={t("common.save")} onPress={save} variant="plain" />
      </View>
      <KeypadScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 32,
          gap: 18,
        }}
      >
        {logged === null && !kindSet && (
          <KindChips value={draft.kind} onChange={(kind) => update({ kind })} />
        )}

        {draft.workoutId !== null ? (
          <Title size={28}>{name}</Title>
        ) : (
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
        )}

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
          {!timed && (
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
          )}
        </View>

        {!timed && (
          <TimeField
            label={t("common.duration")}
            value={draft.minutes * 60}
            min={60}
            onChange={(seconds) => update({ minutes: minutesOf(seconds) })}
          />
        )}

        <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />

        <FocusField
          value={draft.focus}
          onChange={(focus) => update({ focus })}
          note={logged === null ? undefined : t("focus.sessionNote")}
        />

        {draft.done.length > 0 && (
          <DoneDetails
            done={draft.done}
            skipped={draft.skipped}
            unit={unit}
            onChange={(done) => update({ done })}
            onSkip={(skipped) => update({ skipped })}
          />
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

        {logged !== null && items.length > 0 && (
          <Button label={t("workouts.saveAsWorkout")} onPress={saveAsWorkout} variant="link" />
        )}
      </KeypadScrollView>
    </KeyboardAvoidingView>
  );
}
