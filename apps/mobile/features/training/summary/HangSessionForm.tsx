import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { percentOf, protocolDose, type ItemDone } from "@sendtally/core/hang";
import { hangGrid, hangSets, keptSets } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import { Button } from "../components/Button";
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
import { SetupPill } from "../done/SetupPill";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { hangCount } from "./hangCount";
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
  // A set at the session's load follows the pill; one changed by hand keeps its own.
  const [sets, setSets] = React.useState<{ done: ItemDone[]; off: string[] }>(() => ({
    done: [
      {
        item: 0,
        exercise: session.gripId,
        sets: hangSets(session).map(({ weightKg, ...set }) =>
          weightKg === undefined || weightKg === session.loadKg ? set : { ...set, weightKg }
        ),
      },
    ],
    off: [],
  }));
  const kept = keptSets(sets.done, sets.off).map((d) => ({
    ...d,
    exercise: draft.gripId,
    sets: d.sets.map((set) => ({
      ...set,
      ...(kind === "hang" && { edgeMm: draft.edgeMm }),
      weightKg: set.weightKg ?? draft.loadKg,
    })),
  }));
  const grid = hangGrid({ ...draft, done: kept });

  const save = (): void => {
    const { stravaActivityId: _s, postState: _p, postError: _e, updatedAt: _u, ...fields } = draft;
    const planned = session.protocol.sets * session.protocol.reps;
    void actions.saveSession({
      ...fields,
      done: kept,
      pct: percentOf(grid.held, planned),
      misses: Math.max(0, planned - grid.held),
    });
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
        <DoneDetails
          done={sets.done.map((d) => ({ ...d, exercise: model.gripName(draft.gripId) }))}
          off={sets.off}
          planned={[protocolDose(session.protocol)]}
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
          {hangCount(grid, unit)}
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
