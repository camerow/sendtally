import type { SessionRow } from "@sendtally/api-client";
import { formatDate, t } from "../i18n";
import { sessionGradeLabel, type GradeScales } from "./grades";
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

function lengthLabel(session: SessionRow): string[] {
  const minutes = sessionMinutes(session);
  return minutes > 0 ? [durationLabel(minutes)] : [];
}

export function sessionMetaLabel(session: SessionRow): string {
  return [
    ...lengthLabel(session),
    climbCountLabel(session.climb_count),
    ...(isUnscored(session) ? [t("sessions.unscored")] : []),
  ].join(" · ");
}

/** The log row's line: how long, how many sent, and the hardest send unless shown beside it. */
/** What a session's climbs came to: its sends and top send, or, with no sends, how many it attempted. */
export function tallyLabel(
  { sends, attempts, top }: { sends: number; attempts: number; top: string | null },
  withTop = true
): string[] {
  if (sends === 0 && attempts > 0) return [t("tally.attemptedCount", { count: attempts })];
  return [
    t("tally.sentCount", { count: sends }),
    ...(withTop && top !== null ? [t("sessions.topSend", { grade: top })] : []),
  ];
}

export function sessionTallyLabel(
  session: SessionRow,
  scales: GradeScales,
  withTop = true
): string {
  const top =
    session.top_send_grade < 0
      ? null
      : sessionGradeLabel(session.top_send_grade_label, session.top_send_grade, scales);
  const tally = {
    sends: session.send_count,
    attempts: session.climb_count - session.send_count,
    top,
  };
  return [
    ...lengthLabel(session),
    ...tallyLabel(tally, withTop),
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
