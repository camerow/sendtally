export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** A countdown: "7", or "2:05" from a minute up. */
export function clock(seconds: number, alwaysMinutes = false): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60 && !alwaysMinutes) return String(s);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
