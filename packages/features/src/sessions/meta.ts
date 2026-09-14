import type { SessionRow } from "@sendtally/api-client";
import { formatDate, t, upper } from "../i18n";
import { durationLabel, sessionMinutes } from "./years";

export function climbCountLabel(count: number): string {
  return t("sessions.climbCount", { count });
}

export function sessionMetaLabel(session: SessionRow): string {
  return [
    durationLabel(sessionMinutes(session)),
    climbCountLabel(session.climb_count),
    t("sessions.rpeOutOfTen", { rpe: session.rpe }),
  ].join(" · ");
}

export type SessionDay = { weekday: string; day: number };

export function sessionDay(session: Pick<SessionRow, "start_at">): SessionDay {
  const start = new Date(session.start_at);
  return {
    weekday: upper(formatDate(start, { weekday: "short", timeZone: "UTC" })),
    day: start.getUTCDate(),
  };
}
