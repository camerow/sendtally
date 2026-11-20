import React from "react";
import {
  entryNumber,
  entryRange,
  entrySeconds,
  numberEntry,
  openNumber,
  openRange,
  openTime,
  rangeEntry,
  timeEntry,
  timeText,
  typedNumber,
  typedRange,
  typedSeconds,
  type NumberLimits,
  type Range,
  type TimeLimits,
} from "@sendtally/core/hang";
import { countText } from "@sendtally/features/hang";

export type NumberFieldMode = ({ kind: "time" } & TimeLimits) | ({ kind: "number" } & NumberLimits);

export type NumberFieldProps = {
  /** Above the box, or only to a screen reader when `compact`. */
  label: React.ReactNode;
  /** Seconds in time mode; null for no value yet, which shows the placeholder. */
  value: number | null;
  /** What an empty box shows; a dash by default. */
  placeholder?: string;
  /** Called on blur, Enter or an arrow step, only when the value changed. A range's top comes with it. */
  onChange: (value: number, max?: number) => void;
  /** A count that may run to a top, typed "8-12"; the top it has now. */
  range?: { max?: number };
  mode: NumberFieldMode;
  unit?: string;
  /** What the box shows in place of the value until it is typed in, such as "BW" for no added load. */
  display?: string;
  /** A small box sized to its value with no label shown, for a value in a table row. */
  compact?: boolean;
  /** An emptied box commits zero rather than keeping the value it had. */
  clearable?: boolean;
  autoFocus?: boolean;
};

const shown = (mode: NumberFieldMode, value: number): string =>
  mode.kind === "time" ? timeText(openTime(value, mode), mode).join("") : String(value);

/**
 * Typed text as HH:MM:SS filling from the right, as on the keypad, or MM:SS for a time capped
 * under an hour; a digit past the last pair is refused.
 */
function liveTime(text: string, previous: string, limits: TimeLimits): string {
  const digits = text.replace(/\D/g, "");
  if (digits === "") return "";
  const kept = digits.replace(/^0+/, "") || "0";
  const most = limits.max !== undefined && limits.max < 3600 ? 4 : 6;
  return kept.length > most ? previous : timeText({ digits: kept, fresh: false }, limits).join("");
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
  placeholder = "–",
  range,
  clearable = false,
  autoFocus = false,
  display,
}: NumberFieldProps): React.ReactElement {
  const id = React.useId();
  const [draft, setDraft] = React.useState<string | null>(null);
  const limits = mode.kind === "number" ? mode : { step: 1 };
  const text =
    value === null
      ? ""
      : (display ?? (range === undefined ? shown(mode, value) : countText(value, range.max)));
  const time = mode.kind === "time";

  const commitRange = (next: Range | null): void => {
    setDraft(null);
    if (next !== null && (next.min !== value || next.max !== range?.max))
      onChange(next.min, next.max);
  };
  const commit = (next: number | null): void => {
    setDraft(null);
    if (next !== null && next !== value) onChange(next);
  };
  const steppedRange = (key: "plus" | "minus"): Range => {
    const from = (draft === null ? null : typedRange(draft, limits)) ?? {
      min: value ?? 0,
      max: range?.max,
    };
    return entryRange(rangeEntry(openRange(from, limits), { type: key }, limits), limits);
  };

  return (
    <div className={compact ? "number-field number-field--compact" : "number-field"}>
      <label htmlFor={id} className={compact ? "visually-hidden" : "number-field-label"}>
        {label}
      </label>
      <span
        className="number-field-box"
        onMouseDown={(e) => {
          const input = e.currentTarget.querySelector("input");
          if (input === null || e.target === input) return;
          e.preventDefault();
          input.focus();
        }}
      >
        <input
          id={id}
          className="number-field-input"
          inputMode={time ? "numeric" : range === undefined ? "decimal" : "text"}
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          size={compact ? Math.max(2, (text === "" ? placeholder : text).length) : undefined}
          value={draft ?? text}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) =>
            setDraft(time ? liveTime(e.target.value, draft ?? text, mode) : e.target.value)
          }
          onPaste={(e) => {
            if (!time) return;
            e.preventDefault();
            setDraft(liveTime(e.clipboardData.getData("text"), draft ?? text, mode));
          }}
          onSelect={(e) => {
            const input = e.currentTarget;
            const end = input.value.length;
            const all = input.selectionStart === 0 && input.selectionEnd === end;
            if (time && !all && input.selectionStart !== end) input.setSelectionRange(end, end);
          }}
          onBlur={() =>
            range === undefined
              ? commit(draft === null ? null : clearable && draft === "" ? 0 : typed(mode, draft))
              : commitRange(draft === null ? null : typedRange(draft, limits))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNext(e.currentTarget);
            } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && range !== undefined) {
              e.preventDefault();
              commitRange(steppedRange(e.key === "ArrowUp" ? "plus" : "minus"));
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
