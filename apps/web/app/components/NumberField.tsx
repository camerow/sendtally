import React from "react";
import {
  entryNumber,
  entrySeconds,
  numberEntry,
  openNumber,
  openTime,
  timeEntry,
  timeText,
  typedNumber,
  typedSeconds,
  type NumberLimits,
  type TimeLimits,
} from "@sendtally/core/hang";

export type NumberFieldMode = ({ kind: "time" } & TimeLimits) | ({ kind: "number" } & NumberLimits);

export type NumberFieldProps = {
  /** Above the box, or only to a screen reader when `compact`. */
  label: string;
  /** Seconds in time mode; null for no value yet, which shows the placeholder. */
  value: number | null;
  /** What an empty box shows; a dash by default. */
  placeholder?: string;
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
  mode.kind === "time" ? timeText(openTime(value, mode)).join("") : String(value);

/** Typed text as HH:MM:SS filling from the right, as on the keypad; a seventh digit is refused. */
function liveTime(text: string, previous: string): string {
  const digits = text.replace(/\D/g, "");
  if (digits === "") return "";
  const kept = digits.replace(/^0+/, "") || "0";
  return kept.length > 6 ? previous : timeText({ digits: kept, fresh: false }).join("");
}

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
 * phone's own number pad at 375. Time reads HH:MM:SS and fills from the right as digits are typed.
 */
export function NumberField({
  label,
  value,
  onChange,
  mode,
  unit,
  compact = false,
  short = false,
  placeholder = "–",
}: NumberFieldProps): React.ReactElement {
  const id = React.useId();
  const [draft, setDraft] = React.useState<string | null>(null);
  const text = value === null ? "" : shown(mode, value);
  const time = mode.kind === "time";

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
          inputMode={time ? "numeric" : "decimal"}
          autoComplete="off"
          placeholder={placeholder}
          size={compact ? Math.max(2, (text === "" ? placeholder : text).length) : undefined}
          value={draft ?? text}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) =>
            setDraft(time ? liveTime(e.target.value, draft ?? text) : e.target.value)
          }
          onPaste={(e) => {
            if (!time) return;
            e.preventDefault();
            setDraft(liveTime(e.clipboardData.getData("text"), draft ?? text));
          }}
          onSelect={(e) => {
            const input = e.currentTarget;
            const end = input.value.length;
            const all = input.selectionStart === 0 && input.selectionEnd === end;
            if (time && !all && input.selectionStart !== end) input.setSelectionRange(end, end);
          }}
          onBlur={() => commit(draft === null ? null : typed(mode, draft))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext(e.currentTarget);
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const from = (draft === null ? null : typed(mode, draft)) ?? value ?? 0;
              commit(stepped(mode, from, e.key === "ArrowUp" ? "plus" : "minus"));
            }
          }}
        />
        {unit !== undefined && <span className="number-field-unit">{unit}</span>}
      </span>
    </div>
  );
}
