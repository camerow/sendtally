import React from "react";
import type { SetDone, WeightUnit } from "@sendtally/core/hang";
import { setText } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { holdShort } from "@sendtally/features/workouts";
import { SetDoneFields } from "../log/SetDoneFields";

export type SetRowProps = {
  n: number;
  target: SetDone;
  done: SetDone;
  previous: SetDone | undefined;
  lifting: boolean;
  ticked: boolean;
  current: boolean;
  unit: WeightUnit;
  label: string;
  /** ▶ in the Done cell, for the current set when it is timed. */
  go?: React.ReactNode;
  onChange: (set: SetDone) => void;
  onToggle: () => void;
};

/** One set: its number, what it asks and did last time, what was done, and its tick. */
export function SetRow({
  n,
  target,
  done,
  previous,
  lifting,
  ticked,
  current,
  unit,
  label,
  go,
  onChange,
  onToggle,
}: SetRowProps): React.ReactElement {
  const last = previous === undefined ? "" : setText(previous, unit);
  return (
    <div className={current ? "set-row set-row--current" : "set-row"}>
      <span className="set-col-n">{formatNumber(n)}</span>
      <span className="set-col-target">
        <span>{setText(target, unit) || "-"}</span>
        {last !== "" && (
          <span className="set-previous">{t("activities.previousSet", { set: last })}</span>
        )}
      </span>
      <span className="set-col-done">
        {ticked || current ? (
          <SetDoneFields
            set={done}
            lifting={lifting}
            unit={unit}
            label={label}
            go={ticked ? undefined : go}
            holdShort={holdShort(target, done, ticked)}
            onChange={onChange}
          />
        ) : (
          <span className="set-pending">-</span>
        )}
      </span>
      <label className="set-tick">
        <input type="checkbox" checked={ticked} onChange={onToggle} aria-label={label} />
      </label>
    </div>
  );
}
