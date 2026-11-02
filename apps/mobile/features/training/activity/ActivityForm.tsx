import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import type { ActivityRecord } from "@sendtally/api-client";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import {
  defaultExerciseRestS,
  type ItemDone,
  type SessionItem,
  type SetDone,
} from "@sendtally/core/hang";
import {
  activityFromDraft,
  previousSets,
  useActivities,
  kindLabel,
  minutesOf,
  useActivityActions,
  useWeightUnit,
  type ActivityDraft,
} from "@sendtally/features/activities";
import { shortDate, timeOfDay } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { DateTimeField } from "../../../components/DateTimeField";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { TimeField } from "../../../components/TimeField";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EffortField } from "../components/EffortField";
import { FocusField } from "../components/FocusField";
import { Label } from "../components/Label";
import { SheetSection } from "../components/SheetSection";
import { Title } from "../components/Title";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { clearLiveRun } from "../../live-session/liveRun";
import { DoneDetails } from "./DoneDetails";
import { ReadRow } from "./ReadRow";
import { KindChips } from "./KindChips";

export type ActivityFormProps = {
  id: string;
  initial: ActivityDraft;
  /** The activity as logged; null while logging a new one. */
  logged: ActivityRecord | null;
  /**
   * A player ran it: its date, start and length read as measured, each typed over by a tap,
   * and its focus is the workout's. A hangboard run's start and length only read.
   */
  timed?: boolean;
  /** It came with a kind, from a workout; a logged activity always has one. */
  kindSet?: boolean;
  /** It reviews the workout running live, which saving or discarding ends. */
  live?: boolean;
  /** What the workout prescribes, which a set short of its dose reads against. */
  planned?: readonly SessionItem[];
  /** A hangboard workout, which saves as a hang session with its setup and no notes or times. */
  hang?: { setup: React.ReactNode; save: (draft: ActivityDraft) => void };
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

/**
 * Log or edit one activity: kind, title, when, how long, how hard, its focus, and a chip per set
 * to tick. A workout's review says how the run went first. Save sits in the header.
 */
export function ActivityForm({
  id,
  initial,
  logged,
  timed = false,
  kindSet = false,
  live = false,
  planned = [],
  hang,
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
    if (hang === undefined) {
      void actions.saveActivity(activityFromDraft(id, draft));
      router.back();
    } else hang.save(draft);
    if (live) clearLiveRun();
  };
  const discard = (): void =>
    confirmDestructive({
      title: t("hang.discardRunTitle"),
      body: t("hang.discardRunBody"),
      action: t("hang.discard"),
      onConfirm: () => {
        router.back();
        clearLiveRun();
      },
    });
  const name = draft.title.trim() || kindLabel(draft.kind);
  const look = hang === undefined ? draft.kind : "hangboard";
  const doses = planned.map((p) => p.dose);
  const reviewing = logged === null && draft.workoutId !== null;
  const [opened, setOpened] = React.useState<"date" | "start" | "duration" | null>(null);
  const dateField = (
    <SheetSection label={t("activities.date")}>
      <DateTimeField
        testID="activity-date"
        mode="date"
        value={draft.date}
        label={t("activities.date")}
        onChange={(date) => update({ date })}
      />
    </SheetSection>
  );
  // A measured start can be moved, never emptied.
  const startLabel = timed ? t("activities.started") : t("activities.startTime");
  const startField = (
    <SheetSection label={startLabel}>
      <DateTimeField
        testID="activity-time"
        mode="time"
        value={draft.startTime}
        label={startLabel}
        placeholder={t("activities.anyTime")}
        onChange={(startTime) => update({ startTime })}
        onClear={timed ? undefined : () => update({ startTime: "" })}
      />
    </SheetSection>
  );
  const activities = useActivities(api).state;
  // A lift reads against what the last run lifted wherever the workout sets no weight, as the player does.
  const previous = (exercise: string): SetDone[] =>
    draft.kind === "strength" && draft.workoutId !== null && activities.status === "ready"
      ? previousSets(activities.data, draft.workoutId, exercise)
      : [];
  const durationField = (
    <TimeField
      label={t("common.duration")}
      value={draft.minutes * 60}
      min={60}
      onChange={(seconds) => update({ minutes: minutesOf(seconds) })}
    />
  );

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
        {live ? (
          <Button label={t("hang.discard")} onPress={discard} variant="muted" />
        ) : (
          <Button label={t("common.cancel")} onPress={() => router.back()} variant="muted" />
        )}
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {logged !== null
            ? t("summary.editWorkout")
            : reviewing
              ? t("activities.logWorkout")
              : t("activities.logActivity")}
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
          <View style={{ gap: 10 }}>
            <View style={{ gap: 4 }}>
              {reviewing && <Label color={KIND_LOOK[look].ink}>{kindLabel(look)}</Label>}
              <Title size={28}>{name}</Title>
            </View>
          </View>
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

        {timed ? (
          <View>
            {opened === "date" ? (
              dateField
            ) : (
              <ReadRow
                label={t("activities.date")}
                value={shortDate(draft.date)}
                onEdit={() => setOpened("date")}
              />
            )}
            {hang === undefined &&
              (opened === "start" ? (
                startField
              ) : (
                <ReadRow
                  label={t("activities.started")}
                  value={draft.startTime === "" ? "-" : timeOfDay(draft.startTime)}
                  onEdit={() => setOpened("start")}
                />
              ))}
            {hang === undefined &&
              (opened === "duration" ? (
                durationField
              ) : (
                <ReadRow
                  label={t("common.duration")}
                  value={durationLabel(draft.minutes)}
                  onEdit={() => setOpened("duration")}
                />
              ))}
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>{dateField}</View>
              {hang === undefined && <View style={{ flex: 1 }}>{startField}</View>}
            </View>
            {hang === undefined && durationField}
          </>
        )}

        <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />

        {!timed && (
          <FocusField
            value={draft.focus}
            onChange={(focus) => update({ focus })}
            note={logged === null ? undefined : t("focus.sessionNote")}
          />
        )}

        {draft.done.length > 0 && (
          <DoneDetails
            done={draft.done}
            off={draft.off}
            planned={doses}
            unit={unit}
            color={KIND_LOOK[look].ink}
            hangs={hang !== undefined}
            previous={previous}
            setup={hang?.setup}
            onChange={(done, off) => update({ done, off })}
          />
        )}

        {hang === undefined && (
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
        )}

        {logged !== null && items.length > 0 && (
          <Button label={t("workouts.saveAsWorkout")} onPress={saveAsWorkout} variant="link" />
        )}
      </KeypadScrollView>
    </KeyboardAvoidingView>
  );
}
