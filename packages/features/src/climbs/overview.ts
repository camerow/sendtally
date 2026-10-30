import type { ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import { t } from "../i18n";
import type { ClimbStyle } from "../log-session/types";
import { utcDate } from "../log-session/transforms";
import { isUnscored } from "../sessions/meta";
import { sessionTitle } from "../sessions/title";
import { dateLabel } from "./projects";
import { climbGradeLabel, climbKey } from "./transforms";

/** A logged climb is this one when stamped with its id, or, unstamped, when it carries its name. */
export function isThisClimb(
  climb: Pick<ClimbSummary, "id" | "name">,
  logged: { name: string; userClimbId?: string | undefined }
): boolean {
  return logged.userClimbId === undefined
    ? climbKey(logged.name) === climbKey(climb.name)
    : logged.userClimbId === climb.id;
}

/** How the first send went: a flash or onsight is named, any other send is just sent. */
export function sendStyleOf(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbStyle {
  const send = [...sessions]
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .flatMap((s) => s.climbs)
    .find((c) => c.kind === "send" && isThisClimb(climb, c));
  return send?.style ?? "redpoint";
}

export function sendStyleText(style: ClimbStyle): string {
  if (style === "flash") return t("logSession.styleFlash");
  if (style === "onsight") return t("logSession.styleOnsight");
  return t("common.sent");
}

export type ClimbSessionRowVM = {
  fingerprint: string;
  day: string;
  name: string;
  rpe: number | null;
  dateLabel: string;
  meta: string;
  note: string | null;
  triesLabel: string;
};

export type ClimbDetailVM = {
  id: string;
  name: string;
  /** Its discipline, then its grade when it has one. */
  kicker: string;
  /** Where it is, then the day it was first tried. */
  meta: string;
  project: boolean;
  days: string;
  tries: string;
  best: string;
  sessions: ClimbSessionRowVM[];
};

/** Every session with this climb in it, newest first. */
export function climbSessions(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbSessionRowVM[] {
  return [...sessions]
    .sort((a, b) => b.start_at.localeCompare(a.start_at))
    .flatMap((s) => {
      const rows = s.climbs.filter((c) => isThisClimb(climb, c));
      if (rows.length === 0) return [];
      const sent = rows.some((c) => c.kind === "send");
      return [
        {
          fingerprint: s.fingerprint,
          day: utcDate(s.start_at),
          name: sessionTitle(s),
          rpe: isUnscored(s) ? null : s.rpe,
          dateLabel: dateLabel(s.start_at),
          meta: [climb.area?.name, sent ? t("common.sent") : t("sessionDetail.notYet")]
            .filter((p) => p !== undefined)
            .join(" · "),
          note: rows.find((c) => c.note !== null)?.note ?? null,
          triesLabel: t("tally.tryCount", { count: rows.reduce((n, c) => n + c.tries, 0) }),
        },
      ];
    });
}

export function climbDetailVM(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbDetailVM {
  return {
    id: climb.id,
    name: climb.name,
    kicker: [
      t(climb.discipline === "route" ? "common.route" : "common.boulder"),
      ...(climb.grade === null ? [] : [climbGradeLabel(climb)]),
    ].join(" · "),
    meta: [
      ...(climb.area?.name === undefined ? [] : [climb.area.name]),
      t("climbs.firstTried", { date: dateLabel(climb.first_at) }),
    ].join(" · "),
    project: climb.project,
    days: String(climb.sessions),
    tries: String(climb.attempts),
    best: climb.sent_at === null ? "-" : sendStyleText(sendStyleOf(climb, sessions)),
    sessions: climbSessions(climb, sessions),
  };
}
