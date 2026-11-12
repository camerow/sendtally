import React from "react";
import {
  clock,
  entryNumber,
  entrySeconds,
  numberEntry,
  openNumber,
  openTime,
  timeEntry,
  typedNumber,
  typedSeconds,
  type NumberLimits,
  type TimeLimits,
} from "@sendtally/core/hang";

export type NumberFieldMode = ({ kind: "time" } & TimeLimits) | ({ kind: "number" } & NumberLimits);

export type NumberFieldProps = {
  /** Above the box, or only to a screen reader when `compact`. */
  label: string;
  /** Seconds in time mode. */
  value: number;
  /** Called on blur, Enter or an arrow step, only when the value changed. */
  onChange: (value: number) => void;
  mode: NumberFieldMode;
  unit?: string;
  /** A small box sized to its value with no label shown, for a value in a table row. */
  compact?: boolean;
  /** Amber: a value short of what was asked. */
  short?: boolean;
};

const shown = (mode: NumberFieldMode, value: number): string =>
  mode.kind === "time" ? clock(value, true) : String(value);

const typed = (mode: NumberFieldMode, text: string): number | null =>
  mode.kind === "time" ? typedSeconds(text, mode) : typedNumber(text, mode);

const stepped = (mode: NumberFieldMode, value: number, key: "plus" | "minus"): number =>
  mode.kind === "time"
    ? entrySeconds(timeEntry(openTime(value, mode), { type: key }, mode))
    : entryNumber(numberEntry(openNumber(value, mode), { type: key }, mode));

/** Enter moves on as Tab does, to the next field in the form or page. */
function focusNext(from: HTMLInputElement): void {
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>(".number-field-input"));
  const next = fields[fields.indexOf(from) + 1];
  if (next === undefined) from.blur();
  else next.focus();
}

/**
 * A typable number in the keypad field's look: typed on desktop with ↑ ↓ stepping, the
 * phone's own number pad at 375. Time reads and parses as m:ss.
 */
export function NumberField({
  label,
  value,
  onChange,
  mode,
  unit,
  compact = false,
  short = false,
}: NumberFieldProps): React.ReactElement {
  const id = React.useId();
  const [draft, setDraft] = React.useState<string | null>(null);

  const commit = (next: number | null): void => {
    setDraft(null);
    if (next !== null && next !== value) onChange(next);
  };

  return (
    <div className={compact ? "number-field number-field--compact" : "number-field"}>
      <label htmlFor={id} className={compact ? "visually-hidden" : "number-field-label"}>
        {label}
      </label>
      <span className={short ? "number-field-box number-field-box--short" : "number-field-box"}>
        <input
          id={id}
          className="number-field-input"
          inputMode="decimal"
          autoComplete="off"
          size={compact ? Math.max(2, shown(mode, value).length) : undefined}
          value={draft ?? shown(mode, value)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft === null ? null : typed(mode, draft))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext(e.currentTarget);
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const from = draft === null ? value : (typed(mode, draft) ?? value);
              commit(stepped(mode, from, e.key === "ArrowUp" ? "plus" : "minus"));
            }
          }}
        />
        {unit !== undefined && <span className="number-field-unit">{unit}</span>}
      </span>
    </div>
  );
}
