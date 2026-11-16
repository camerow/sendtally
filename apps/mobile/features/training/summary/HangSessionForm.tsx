import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Text } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { hangEditResult, hangEditSets, shortDate } from "@sendtally/features/hang";
import { hangSessionItems } from "@sendtally/core/hang";
import { hangTotals } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import { DateField } from "../components/DateField";
import { EffortField } from "../components/EffortField";
import { FocusField } from "../components/FocusField";
import { MonthCalendar } from "../components/MonthCalendar";
import { SelectField } from "../components/SelectField";
import { SheetSection } from "../components/SheetSection";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { DoneDetails } from "../activity/DoneDetails";
import { EditorHeader } from "../components/EditorHeader";
import { SetupPill } from "../done/SetupPill";
import { KIND_LOOK } from "@sendtally/features/training";
import { type } from "../type";
import { hangCount } from "@sendtally/features/activities";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { Toast } from "../../../components/Toast";

export type HangSessionFormProps = { session: HangSessionRecord };

/**
 * Edit a finished hangboard session: its day, grip, each set's hangs and load under the pill
 * that sets the edge and every set's load not changed by hand, effort and focus.
 */
export function HangSessionForm({ session }: HangSessionFormProps): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [draft, setDraft] = React.useState(session);
  const [calendar, setCalendar] = React.useState(false);
  const [picker, setPicker] = React.useState(false);
  const [removed, setRemoved] = React.useState<{ message: string; undo: () => void } | null>(null);
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
  const unit = model.settings.units;
  const [sets, setSets] = React.useState(() => hangEditSets(session));
  const result = hangEditResult(session, sets, draft.gripId, {
    edgeMm: draft.edgeMm,
    loadKg: draft.loadKg,
  });
  const totals = hangTotals({ ...draft, done: result.done });

  const save = (): void => {
    const { stravaActivityId: _s, postState: _p, postError: _e, updatedAt: _u, ...fields } = draft;
    void actions.saveSession({
      ...fields,
      done: result.done,
      pct: result.pct,
      misses: result.misses,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <EditorHeader title={t("summary.editWorkout")} onCancel={() => router.back()} onSave={save} />
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
        <DoneDetails
          done={sets.done.map((d) => ({
            ...d,
            exercise: model.gripName(d.item === 0 ? draft.gripId : d.exercise),
          }))}
          off={sets.off}
          planned={hangSessionItems(session).map((i) => i.dose)}
          unit={unit}
          color={KIND_LOOK.hangboard.ink}
          hangs
          hangLoadKg={draft.loadKg}
          setup={
            <SetupPill
              kind={kind}
              setup={{ edgeMm: draft.edgeMm, loadKg: draft.loadKg }}
              kicker={model.gripName(draft.gripId)}
              onChange={(setup) => update(setup)}
            />
          }
          onRemoved={(message, undo) => setRemoved({ message, undo })}
          onChange={(done, off) => setSets({ done, off })}
        />
        <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>
          {hangCount(totals, unit)}
        </Text>
        <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />
        <FocusField value={draft.focus} onChange={(focus) => update({ focus })} />
      </KeypadScrollView>
      {removed !== null && (
        <Toast
          message={removed.message}
          action={{ label: t("tally.undo"), onPress: removed.undo }}
          onHide={() => setRemoved(null)}
        />
      )}
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
