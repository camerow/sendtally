import React from "react";
import type { SetDone, WeightUnit } from "@sendtally/core/hang";
import { setSeconds, setText } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { SetDoneFields } from "./SetDoneFields";

export type ReviewSetRowProps = {
  n: number;
  /** What the set asked; none when it was not planned. */
  target: SetDone | undefined;
  done: SetDone;
  hangs: boolean;
  lifting: boolean;
  unit: WeightUnit;
  /** Ticked, it counts; off, it does not save, though its fields stay live and typing ticks it. */
  on: boolean;
  /** "4 of 6 hangs" when it fell short of its target. */
  short: string | null;
  label: string;
  defaultLoadKg?: number;
  onChange: (set: SetDone) => void;
  onToggle: () => void;
  onRemove: () => void;
};

/** A hang target reads "6 × 7s"; anything else as its set reads. */
const targetText = (target: SetDone, hangs: boolean, unit: WeightUnit): string =>
  hangs && target.reps !== undefined && target.onS !== undefined
    ? `${formatNumber(target.reps)} × ${setSeconds(target.onS)}`
    : setText(target, unit);

/** One set to review: what it asked, what was done, its tick, and × to remove it. */
export function ReviewSetRow({
  n,
  target,
  done,
  hangs,
  lifting,
  unit,
  on,
  short,
  label,
  defaultLoadKg,
  onChange,
  onToggle,
  onRemove,
}: ReviewSetRowProps): React.ReactElement {
  return (
    <div className={on ? "set-row" : "set-row set-row--off"} data-testid="review-set">
      <span className="set-col-n">{formatNumber(n)}</span>
      <span className="set-col-target">
        <span>{target === undefined ? "-" : targetText(target, hangs, unit) || "-"}</span>
        {on && short !== null && <span className="set-short">{short}</span>}
      </span>
      <span className="set-col-done">
        {done.climbs === undefined ? (
          <SetDoneFields
            set={done}
            lifting={lifting}
            hangs={hangs}
            short={on && short !== null}
            unit={unit}
            label={label}
            defaultLoadKg={defaultLoadKg}
            onChange={onChange}
          />
        ) : (
          <span className="set-climbs">{setText(done, unit)}</span>
        )}
      </span>
      <label className="set-tick">
        <input type="checkbox" checked={on} onChange={onToggle} aria-label={label} />
      </label>
      <button
        type="button"
        className="set-remove"
        aria-label={t("activities.removeSet", { n })}
        onClick={onRemove}
      >
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
