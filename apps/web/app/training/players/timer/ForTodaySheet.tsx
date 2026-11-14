import React from "react";
import type { HangSetup } from "@sendtally/core/hang";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { TodayEntry } from "@sendtally/features/workouts";
import { Sheet } from "../../../components/Sheet";
import { useHangData } from "../../data/HangDataContext";
import { SetupFields } from "../../log/SetupFields";

export type ForTodaySheetProps = {
  open: boolean;
  kicker: string;
  entries: readonly TodayEntry[];
  setups: readonly HangSetup[];
  onChange: (setups: HangSetup[]) => void;
  onClose: () => void;
};

/** This run's edge and weight, changed for today only; the plan stays as written. */
export function ForTodaySheet({
  open,
  kicker,
  entries,
  setups,
  onChange,
  onClose,
}: ForTodaySheetProps): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const planned = entries.map((e) => setupLabel(e.kind, e.planned, unit)).join(", ");
  return (
    <Sheet
      open={open}
      kicker={kicker}
      title={t("hang.forToday")}
      onClose={onClose}
      cancel={false}
      action={{ label: t("common.done"), onPress: onClose }}
    >
      {entries.map((e, i) => (
        <div key={i} className="timer-today-entry">
          {entries.length > 1 && <span className="train-label">{model.gripName(e.gripId)}</span>}
          <SetupFields
            kind={e.kind}
            setup={setups[i] ?? e.planned}
            onChange={(setup) => onChange(setups.map((old, j) => (j === i ? setup : old)))}
          />
        </div>
      ))}
      <p className="form-hint">{t("hang.forTodayNote", { planned })}</p>
    </Sheet>
  );
}
