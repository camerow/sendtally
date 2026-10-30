import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { clamp } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import { Button } from "../components/Button";
import { DateField } from "../components/DateField";
import { EffortField } from "../components/EffortField";
import { FocusField } from "../components/FocusField";
import { MonthCalendar } from "../components/MonthCalendar";
import { SelectField } from "../components/SelectField";
import { SheetSection } from "../components/SheetSection";
import { NumberField } from "../components/NumberField";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { LoadField } from "../loads/LoadField";
import { EdgeField } from "../setup/EdgeField";
import { type } from "../type";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { useFieldOrder } from "../../../components/useFieldOrder";

const PCT_STEP = 5;

export type HangSessionFormProps = { session: HangSessionRecord };

/** Edit a finished hangboard session: its day, grip, edge, weight, completion, effort and focus. */
export function HangSessionForm({ session }: HangSessionFormProps): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [draft, setDraft] = React.useState(session);
  const [calendar, setCalendar] = React.useState(false);
  const [picker, setPicker] = React.useState(false);
  const update = (patch: Partial<HangSessionRecord>): void => setDraft((d) => ({ ...d, ...patch }));
  const workout = model.workout(session.workoutId) ?? {
    ...session.protocol,
    id: session.workoutId,
    source: "mine" as const,
    grip: session.gripId,
    timeUnits: { hangS: "s" as const, restS: "s" as const, setRestS: "min" as const },
  };
  const kind = session.protocol.kind;
  const name = hangTitle(session);
  const { slot } = useFieldOrder(
    kind === "hang" ? ["edge", "load", "completion"] : ["load", "completion"]
  );
  const setPct = (pct: number): void => update({ pct: clamp(Math.round(pct), 0, 100) });

  const save = (): void => {
    const { stravaActivityId: _s, postState: _p, postError: _e, updatedAt: _u, ...fields } = draft;
    void actions.saveSession(fields);
    router.back();
  };

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
          {t("summary.editWorkout")}
        </Text>
        <Button label={t("common.save")} onPress={save} variant="plain" />
      </View>
      <KeypadScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 32, gap: 18 }}
      >
        <Title size={28}>{name}</Title>
        <SheetSection label={t("hang.date")}>
          <DateField
            text={shortDate(draft.date)}
            open={calendar}
            onToggle={() => setCalendar(!calendar)}
            label={t("hang.date")}
          />
          {calendar && (
            <MonthCalendar
              selected={draft.date}
              min={null}
              max={today}
              today={today}
              shaded={() => false}
              onPick={(date) => {
                update({ date });
                setCalendar(false);
              }}
            />
          )}
        </SheetSection>
        <SheetSection label={t("hang.grip")}>
          <SelectField
            text={model.gripName(draft.gripId)}
            placeholder={false}
            label={t("hang.grip")}
            onPress={() => setPicker(true)}
          />
        </SheetSection>
        {kind === "hang" && (
          <EdgeField
            {...slot("edge")}
            edgeMm={draft.edgeMm}
            onChange={(edgeMm) => update({ edgeMm })}
          />
        )}
        <LoadField
          {...slot("load")}
          kind={kind}
          kg={draft.loadKg}
          unit={model.settings.units}
          label={t("hang.load")}
          onChange={(loadKg) => update({ loadKg })}
        />
        <NumberField
          {...slot("completion")}
          label={t("hang.completion")}
          value={draft.pct}
          onChange={setPct}
          unit="%"
          step={PCT_STEP}
          max={100}
        />
        <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />
        <FocusField
          value={draft.focus}
          onChange={(focus) => update({ focus })}
          note={t("focus.sessionNote")}
        />
      </KeypadScrollView>
      <GripPickerSheet
        visible={picker}
        workout={workout}
        multi={false}
        selected={[draft.gripId]}
        onPick={(gripId) => update({ gripId })}
        onClose={() => setPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
