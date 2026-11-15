import { clamp } from "./parse";

/** Keys a keypad sends to an entry. A digit is "0" to "9" or "00". */
export type EntryAction =
  | { type: "digit"; digit: string }
  | { type: "back" }
  | { type: "plus" }
  | { type: "minus" }
  | { type: "done" }
  | { type: "decimal" }
  | { type: "sign" }
  | { type: "to" };

/** Typed digits of a length of time, filling HH:MM:SS from the right. `fresh` until the first key after opening. */
export type TimeEntry = { digits: string; fresh: boolean };

export type TimeLimits = { min?: number; max?: number };

const TIME_STEP = 30;
const TIME_DIGITS = 6;
const DAY_MAX = 24 * 3600 - 1;

const padded = (digits: string): string => digits.padStart(TIME_DIGITS, "0").slice(-TIME_DIGITS);

/** The seconds the digits stand for as typed, overflow included: "90" is 90 s. */
export function entrySeconds({ digits }: TimeEntry): number {
  const p = padded(digits);
  return Number(p.slice(0, 2)) * 3600 + Number(p.slice(2, 4)) * 60 + Number(p.slice(4, 6));
}

function digitsOf(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return String(h * 10000 + m * 100 + (seconds % 60));
}

const bounded = (seconds: number, { min = 0, max = DAY_MAX }: TimeLimits): number =>
  clamp(Math.round(seconds), Math.max(0, min), Math.min(DAY_MAX, max));

/** A time entry opened on a value: the first digit typed replaces it. */
export function openTime(seconds: number, limits: TimeLimits = {}): TimeEntry {
  return { digits: digitsOf(bounded(seconds, limits)), fresh: true };
}

/** The next time entry after a key. Done carries overflow (00:00:90 is 00:01:30) and clamps. */
export function timeEntry(
  state: TimeEntry,
  action: EntryAction,
  limits: TimeLimits = {}
): TimeEntry {
  switch (action.type) {
    case "digit": {
      const base = state.fresh ? "" : state.digits;
      const next = (base + action.digit).replace(/^0+/, "") || "0";
      return { digits: next.length > TIME_DIGITS ? state.digits : next, fresh: false };
    }
    case "back":
      return { digits: state.digits.slice(0, -1) || "0", fresh: false };
    case "plus":
    case "minus": {
      const step = action.type === "plus" ? TIME_STEP : -TIME_STEP;
      return { digits: digitsOf(bounded(entrySeconds(state) + step, limits)), fresh: false };
    }
    case "done":
      return openTime(entrySeconds(state), limits);
    case "decimal":
    case "sign":
    case "to":
      return state;
  }
}

/** "HH:MM:SS" split where the dimmed leading zeros end: 7 s is ["00:00:0", "7"]. */
export function timeText(state: TimeEntry): [zeros: string, rest: string] {
  const p = padded(state.digits);
  const text = `${p.slice(0, 2)}:${p.slice(2, 4)}:${p.slice(4, 6)}`;
  const first = text.search(/[1-9]/);
  const cut = first === -1 ? text.length - 1 : first;
  return [text.slice(0, cut), text.slice(cut)];
}

/** A typed number, "." for the decimal point and a leading "-" when negative. */
export type NumberEntry = { text: string; fresh: boolean };

export type NumberLimits = {
  step: number;
  min?: number;
  max?: number;
  decimals?: boolean;
  signed?: boolean;
};

const NUMBER_CHARS = 8;

/** The value a number entry holds as typed. */
export function entryNumber({ text }: NumberEntry): number {
  const n = Number(text === "-" ? "0" : text);
  return Number.isFinite(n) ? n : 0;
}

const boundedNumber = (n: number, { min, max, signed = false }: NumberLimits): number =>
  clamp(Math.round(n * 1000) / 1000, min ?? (signed ? -Infinity : 0), max ?? Infinity);

/** A number entry opened on a value: the first digit typed replaces it. */
export function openNumber(value: number, limits: NumberLimits): NumberEntry {
  return { text: String(boundedNumber(value, limits)), fresh: true };
}

/** The next number entry after a key. ± steps by the field's step; done clamps to its limits. */
export function numberEntry(
  state: NumberEntry,
  action: EntryAction,
  limits: NumberLimits
): NumberEntry {
  const text = state.fresh ? "0" : state.text;
  switch (action.type) {
    case "digit": {
      const next = (text + action.digit).replace(/^(-?)0+(?=\d)/, "$1");
      return { text: next.replace("-", "").length > NUMBER_CHARS ? text : next, fresh: false };
    }
    case "decimal":
      return limits.decimals === true && !text.includes(".")
        ? { text: `${text}.`, fresh: false }
        : state;
    case "sign":
      if (limits.signed !== true) return state;
      return {
        text: state.text.startsWith("-") ? state.text.slice(1) : `-${state.text}`,
        fresh: false,
      };
    case "back": {
      const next = state.text.slice(0, -1);
      return { text: next === "" || next === "-" ? "0" : next, fresh: false };
    }
    case "plus":
    case "minus": {
      const step = action.type === "plus" ? limits.step : -limits.step;
      return { text: String(boundedNumber(entryNumber(state) + step, limits)), fresh: false };
    }
    case "to":
      return state;
    case "done":
      return openNumber(entryNumber(state), limits);
  }
}

/** A count that may run to a top: 3 sets, or 3 to 5. No top, or one at or under the bottom, is one number. */
export type Range = { min: number; max?: number };

/** "3-5", or "3" with no top. */
export const rangeText = ({ min, max }: Range): string =>
  max === undefined || max <= min ? String(min) : `${min}-${max}`;

/** A typed range read with its ends in order, each clamped; equal ends are one number. */
export function entryRange({ text }: NumberEntry, limits: NumberLimits): Range {
  const [bottom = "", top = ""] = text.split("-");
  const a = boundedNumber(Number(bottom || "0"), limits);
  if (top === "") return { min: a };
  const b = boundedNumber(Number(top), limits);
  return a === b ? { min: a } : { min: Math.min(a, b), max: Math.max(a, b) };
}

/** A range entry opened on a value: the first digit typed replaces it. */
export const openRange = (range: Range, limits: NumberLimits): NumberEntry => ({
  text: rangeText(entryRange({ text: rangeText(range), fresh: true }, limits)),
  fresh: true,
});

/**
 * The next range entry after a key: To starts the top after what is there, digits and ± work
 * on the end being typed, and deleting back past the hyphen leaves one number again.
 */
export function rangeEntry(
  state: NumberEntry,
  action: EntryAction,
  limits: NumberLimits
): NumberEntry {
  const cut = state.text.indexOf("-");
  if (action.type === "to")
    return cut === -1 ? { text: `${state.text}-`, fresh: false } : { ...state, fresh: false };
  if (action.type === "done") return openRange(entryRange(state, limits), limits);
  if (
    cut === -1 ||
    (state.fresh && action.type === "digit") ||
    action.type === "decimal" ||
    action.type === "sign"
  )
    return numberEntry(state, action, limits);
  const bottom = state.text.slice(0, cut);
  const top = state.text.slice(cut + 1);
  if (action.type === "back")
    return { text: top === "" ? bottom : `${bottom}-${top.slice(0, -1)}`, fresh: false };
  const end = numberEntry({ text: top === "" ? "0" : top, fresh: false }, action, limits);
  return { text: `${bottom}-${end.text}`, fresh: false };
}

/** A range typed as text, "8-12" or "8", clamped as the keypad would; null when it is not one. */
export function typedRange(text: string, limits: NumberLimits): Range | null {
  const parts = text.trim().split(/\s*[-–]\s*/);
  if (parts.length > 2 || parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;
  return entryRange({ text: parts.join("-"), fresh: false }, limits);
}

/** Seconds from a time typed as text, "1:30" or "130", read as the same digits on the keypad; null when nothing was typed. */
export function typedSeconds(text: string, limits: TimeLimits = {}): number | null {
  const digits = text.replace(/\D/g, "");
  if (digits === "") return null;
  const typed = { digits: digits.slice(-TIME_DIGITS), fresh: false };
  return entrySeconds(timeEntry(typed, { type: "done" }, limits));
}

/** A number typed as text, a comma read as the decimal point, clamped as the keypad would; null when it is not one. */
export function typedNumber(text: string, limits: NumberLimits): number | null {
  const trimmed = text.trim().replace(",", ".");
  const n = Number(trimmed);
  if (trimmed === "" || !Number.isFinite(n)) return null;
  const whole = limits.decimals === true ? n : Math.round(n);
  return entryNumber(openNumber(limits.signed === true ? whole : Math.abs(whole), limits));
}
