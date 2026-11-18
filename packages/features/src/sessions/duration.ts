import type { SessionRow } from "@sendtally/api-client";
import { rowMinutes } from "@sendtally/core";
import { t } from "../i18n";

type Timed = Pick<SessionRow, "times">;

export function hasStart(session: Timed): boolean {
  return session.times === "both" || session.times === "start";
}

export function hasEnd(session: Timed): boolean {
  return session.times === "both" || session.times === "end";
}

/** A real length in minutes, or 0 when the session has none. */
export function sessionMinutes(session: Pick<SessionRow, "times" | "start_at" | "end_at">): number {
  return session.times === "both" || session.times === "duration" ? rowMinutes(session) : 0;
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = `${h}${t("sessions.hoursShort")}`;
  if (h === 0) return `${m}${t("sessions.minutesShort")}`;
  return m === 0 ? hours : `${hours} ${String(m).padStart(2, "0")}${t("sessions.minutesShort")}`;
}

export const clampMinutes = (n: number): number => Math.min(1440, Math.max(1, Math.round(n)));

/** A length typed in seconds as the whole minutes an activity keeps, one to a day. */
export const minutesOf = (seconds: number): number => clampMinutes(seconds / 60);
