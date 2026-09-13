import type { SessionRow } from "@sendtally/api-client";
import { durationLabel, sessionMinutes } from "./years";

export function climbCountLabel(count: number): string {
  return count === 1 ? "1 climb" : `${count} climbs`;
}

export function sessionMetaLabel(session: SessionRow): string {
  return [
    durationLabel(sessionMinutes(session)),
    climbCountLabel(session.climb_count),
    `RPE ${session.rpe}/10`,
  ].join(" · ");
}

export type SessionDay = { weekday: string; day: number };

export function sessionDay(session: Pick<SessionRow, "start_at">): SessionDay {
  const start = new Date(session.start_at);
  return {
    weekday: start.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(),
    day: start.getUTCDate(),
  };
}
