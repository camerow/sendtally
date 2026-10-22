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
import { colors, fonts, radius } from "@sendtally/design/tokens";
import {
  activityFromDraft,
  kindLabel,
  parseMinutes,
  stepMinutes,
  templateOf,
  trainingLoadLabel,
  useActivityActions,
  usePlanTemplate,
  useWeightUnit,
  type ActivityDraft,
} from "@sendtally/features/activities";
import type { ActivityDetail } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { DateTimeField } from "../../../components/DateTimeField";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EffortField } from "../components/EffortField";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { Title } from "../components/Title";
import { DetailSection } from "../detail/DetailSection";
import { startIntervals } from "../intervals/intervalsParams";
import { type } from "../type";
import { KindChips } from "./KindChips";

export type ActivityFormProps = {
  id: string;
  initial: ActivityDraft;
  /** Editing an activity already logged, which can also be deleted. */
  editing: boolean;
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

/** Log or edit one activity: kind, title, when, how long, how hard, its sets or checklist, and its training load. */
export function ActivityForm({ id, initial, editing }: ActivityFormProps): React.ReactElement {
  const api = useApi();
  const actions = useActivityActions(api, reportFailure);
  const [draft, setDraft] = React.useState(initial);
  const update = (patch: Partial<ActivityDraft>): void => setDraft((d) => ({ ...d, ...patch }));
  const load = trainingLoadLabel(draft);
  const unit = useWeightUnit(api);
  const targets = usePlanTemplate(api, draft.planItemId) ?? null;

  const start = (detail: ActivityDetail): void => {
    const body = templateOf(detail);
    if (body?.kind !== "intervals") return;
    const { kind, title, date, planItemId } = draft;
    startIntervals({ kind, title, date, planItemId, activityId: editing ? null : id, body });
  };
  const save = (): void => {
    void actions.saveActivity(activityFromDraft(id, draft));
    router.back();
  };
  const remove = (): void =>
    Alert.alert(t("activities.deleteTitle"), t("activities.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          router.back();
          void actions.deleteActivity(id);
        },
      },
    ]);

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
            {editing ? t("activities.editActivity") : t("activities.logActivity")}
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

        <DetailSection
          value={draft.detail}
          kind={draft.kind}
          unit={unit}
          targets={targets}
          template={false}
          inSheet={false}
          onStart={start}
          onChange={(detail) => update({ detail })}
        />

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

        <View style={{ gap: 6 }}>
          <Button label={t("common.save")} onPress={save} variant="primary" height={54} />
          {editing && (
            <Button label={t("activities.deleteActivity")} onPress={remove} variant="danger" />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
