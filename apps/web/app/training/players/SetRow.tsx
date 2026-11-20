import React from "react";
import type { SetDone, WeightUnit } from "@sendtally/core/hang";
import { setChip } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { RpeField } from "../components/RpeField";
import { SetDoneFields } from "../components/SetDoneFields";

export type SetRowProps = {
  n: number;
  /** In place of the set's number: a superset member's letter and round, "B2". */
  tag?: string;
  /** Before its target: a superset member's exercise. */
  name?: string;
  target: SetDone;
  /** The top of a rep range the target runs to. */
  repsMax?: number;
  done: SetDone;
  previous: SetDone | undefined;
  lifting: boolean;
  ticked: boolean;
  current: boolean;
  unit: WeightUnit;
  label: string;
  /** ▶ in the Done cell, for the current set when it is timed. */
  go?: React.ReactNode;
  /** Where the exercise asks for a set RPE: the target its cell shows dim. */
  rpe?: { target: number | undefined };
  onChange: (set: SetDone) => void;
  onToggle: () => void;
  /** Makes it the current set, as a click anywhere on it does. */
  onFocus?: () => void;
  /** − beside the tick, on the current set: takes the set out. */
  onRemove?: () => void;
};

/** One set: its number, what it asks and did last time, what was done, and its tick. */
export function SetRow({
  n,
  tag,
  name,
  target,
  repsMax,
  done,
  previous,
  lifting,
  ticked,
  current,
  unit,
  label,
  go,
  rpe,
  onChange,
  onToggle,
  onFocus,
  onRemove,
}: SetRowProps): React.ReactElement {
  const last = previous === undefined ? "" : setChip(previous, unit);
  return (
    <div className={current ? "set-row set-row--current" : "set-row"} onClick={onFocus}>
      <span className="set-col-n">{tag ?? formatNumber(n)}</span>
      <span className="set-col-target">
        <span>{[name, setChip(target, unit, repsMax) || "-"].filter(Boolean).join(" ")}</span>
      </span>
      <span className="set-col-done">
        <SetDoneFields
          set={done}
          lifting={lifting}
          unit={unit}
          label={label}
          go={ticked ? undefined : go}
          onChange={onChange}
        />
      </span>
      {rpe !== undefined && (
        <span className="set-col-rpe">
          {ticked && <RpeField set={done} target={rpe.target} label={label} onChange={onChange} />}
        </span>
      )}
      <label className="set-tick">
        <input type="checkbox" checked={ticked} onChange={onToggle} aria-label={label} />
      </label>
      {current && onRemove !== undefined ? (
        <button
          type="button"
          className="set-remove set-remove--run"
          aria-label={t("activities.removeSet", { n })}
          onClick={onRemove}
        >
          <Icon name="minusCircle" size={24} strokeWidth={1.5} />
        </button>
      ) : (
        <span className="set-remove" />
      )}
      {last !== "" && (
        <span className="set-previous">{t("activities.previousSet", { set: last })}</span>
      )}
    </div>
  );
}
