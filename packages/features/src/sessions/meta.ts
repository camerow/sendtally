import type { SessionRow } from "@sendtally/api-client";
import { formatDate, t } from "../i18n";
import { durationLabel, sessionMinutes } from "./years";

export function climbCountLabel(count: number): string {
  return t("common.climbCount", { count });
}

/** The untitled, unscored session a climb added on its own is filed in: it reads as those climbs, never as a session. */
export function isClimbHolder(
  session: Pick<SessionRow, "source" | "name" | "rpe_source">
): boolean {
  return session.source === "manual" && (session.name ?? "").trim() === "" && isUnscored(session);
}

export function isUnscored(session: Pick<SessionRow, "rpe_source">): boolean {
  return session.rpe_source === "none";
}

export function sessionMetaLabel(session: SessionRow): string {
  return [
    ...(session.times === "both" ? [durationLabel(sessionMinutes(session))] : []),
    climbCountLabel(session.climb_count),
    ...(isUnscored(session) ? [t("sessions.unscored")] : []),
  ].join(" · ");
}

/** The log row's line: how long, how many sent, and the hardest send unless shown beside it. */
export function sessionTallyLabel(session: SessionRow, withTop = true): string {
  const top =
    !withTop || session.top_send_grade < 0
      ? []
      : [
          t("sessions.topSend", {
            grade: session.top_send_grade_label ?? `V${session.top_send_grade}`,
          }),
        ];
  return [
    ...(session.times === "both" ? [durationLabel(sessionMinutes(session))] : []),
    t("tally.sentCount", { count: session.send_count }),
    ...top,
    ...(isUnscored(session) ? [t("sessions.unscored")] : []),
  ].join(" · ");
}

export type SessionDay = { weekday: string; day: number };

export function sessionDay(session: Pick<SessionRow, "start_at">): SessionDay {
  const start = new Date(session.start_at);
  return {
    weekday: formatDate(start, { weekday: "short", timeZone: "UTC" }),
    day: start.getUTCDate(),
  };
}
