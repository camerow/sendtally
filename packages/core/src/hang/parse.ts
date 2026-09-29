import type { TimeUnit } from "./types";

/** Reads a typed number, accepting a comma decimal and the "−" minus sign. */
export function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(",", ".").replace("−", "-");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  return Number(trimmed);
}

/** "90", "1:30" or, in min mode, a bare number of minutes. Returns seconds. */
export function parseSeconds(text: string, unit: TimeUnit): number | null {
  const trimmed = text.trim();
  if (trimmed.includes(":")) {
    const [m = "", s = ""] = trimmed.split(":");
    const minutes = m === "" ? 0 : parseNumber(m);
    const seconds = s === "" ? 0 : parseNumber(s);
    return minutes === null || seconds === null ? null : minutes * 60 + seconds;
  }
  const n = parseNumber(trimmed);
  if (n === null) return null;
  return unit === "min" ? n * 60 : n;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** "7" in sec mode, "3:00" in min mode. */
export function secondsText(seconds: number, unit: TimeUnit): string {
  return unit === "min" ? clock(seconds, true) : String(seconds);
}

/** A countdown: "7", or "2:05" from a minute up. */
export function clock(seconds: number, alwaysMinutes = false): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60 && !alwaysMinutes) return String(s);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
