import React from "react";
import { View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { clamp, parseNumber } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { DateField } from "../../components/DateField";
import { MonthCalendar } from "../../components/MonthCalendar";
import { SelectField } from "../../components/SelectField";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";
import { SheetSection } from "../../components/SheetSection";
import { Stepper } from "../../components/Stepper";
import { UnitSwitch } from "../../components/UnitSwitch";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { loadControl } from "../loads/loadControl";
import { confirmDelete } from "./confirmDelete";
import { EffortField } from "./EffortField";

const PCT_STEP = 5;

function Editor({
  session,
  onClose,
}: {
  session: HangSessionRecord;
  onClose: () => void;
}): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [open, setOpen] = React.useState(true);
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
  const load = loadControl(kind, draft.loadKg, model.settings.units, (loadKg) =>
    update({ loadKg })
  );
  const setPct = (pct: number): void => update({ pct: clamp(Math.round(pct), 0, 100) });

  const save = (): void => {
    const { stravaActivityId: _s, postState: _p, postError: _e, updatedAt: _u, ...fields } = draft;
    void actions.saveSession(fields);
    setOpen(false);
  };
  const remove = (): void =>
    confirmDelete(session.stravaActivityId !== null, () => {
      void actions.deleteSession(session.id);
      setOpen(false);
    });

  return (
    <Sheet visible={open} onClose={onClose} closeLabel={t("hang.cancel")}>
      <View style={{ gap: 22 }}>
        <SheetHeader
          kicker={shortDate(session.date)}
          title={workout.name}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
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
        <SheetSection label={t("hang.load")} aside={<UnitSwitch />}>
          <Stepper
            value={load.text}
            onCommit={load.commit}
            onStep={load.step}
            label={t("hang.load")}
            decreaseLabel={t("hang.lessWeight")}
            increaseLabel={t("hang.moreWeight")}
            surface="light"
            keyboard="numbers-and-punctuation"
            inSheet
          />
        </SheetSection>
        <SheetSection label={t("hang.completion")}>
          <Stepper
            value={String(draft.pct)}
            onCommit={(text) => {
              const n = parseNumber(text);
              if (n !== null) setPct(n);
            }}
            onStep={(dir) => setPct(draft.pct + dir * PCT_STEP)}
            label={t("hang.completion")}
            decreaseLabel={t("hang.lessCompletion")}
            increaseLabel={t("hang.moreCompletion")}
            surface="light"
            keyboard="number-pad"
            inSheet
          />
        </SheetSection>
        <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} surface="light" />
        <View style={{ gap: 10 }}>
          <Button label={t("hang.saveChanges")} onPress={save} variant="ink" height={54} />
          <Button
            label={t("hang.deleteSession")}
            onPress={remove}
            variant="outlineLight"
            height={48}
          />
        </View>
      </View>
      <GripPickerSheet
        visible={picker}
        workout={workout}
        multi={false}
        selected={[draft.gripId]}
        onPick={(gripId) => update({ gripId })}
        onClose={() => setPicker(false)}
      />
    </Sheet>
  );
}

export type SessionEditorSheetProps = { sessionId: string | null; onClose: () => void };

// The row is read once per open, so the sheet can slide away after a delete
// has already taken the session out of the data.
function EditorLoader({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}): React.ReactElement | null {
  const { model } = useHangData();
  const [session] = React.useState(() => model.sessions.find((s) => s.id === sessionId));
  return session === undefined ? null : <Editor session={session} onClose={onClose} />;
}

/** Edit or delete a logged session. Everything derived recomputes from the saved row. */
export function SessionEditorSheet({
  sessionId,
  onClose,
}: SessionEditorSheetProps): React.ReactElement | null {
  return sessionId === null ? null : (
    <EditorLoader key={sessionId} sessionId={sessionId} onClose={onClose} />
  );
}
