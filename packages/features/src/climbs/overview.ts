import type { ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import { t } from "../i18n";
import { utcDate } from "../log-session/transforms";
import { monthShortName } from "../sessions/months";
import { dateLabel } from "./projects";
import { climbGradeLabel, climbKey } from "./transforms";

export function dayCountLabel(climb: ClimbSummary): string {
  return `${t("climbs.dayCount", { count: climb.sessions })} · ${t("tally.tryCount", { count: climb.attempts })}`;
}

export type ClimbVisitVM = {
  fingerprint: string;
  day: string;
  month: string;
  dayOfMonth: string;
  triesLabel: string;
  note: string | null;
};

export type ClimbDetailVM = {
  id: string;
  name: string;
  gradeLabel: string | null;
  eyebrow: string;
  status: string;
  working: boolean;
  visits: ClimbVisitVM[];
};

/** A logged climb is this one when stamped with its id, or, unstamped, when it carries its name. */
export function isThisClimb(
  climb: Pick<ClimbSummary, "id" | "name">,
  logged: { name: string; userClimbId?: string | undefined }
): boolean {
  return logged.userClimbId === undefined
    ? climbKey(logged.name) === climbKey(climb.name)
    : logged.userClimbId === climb.id;
}

export function climbVisits(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbVisitVM[] {
  return [...sessions]
    .sort((a, b) => b.start_at.localeCompare(a.start_at))
    .flatMap((s) => {
      const rows = s.climbs.filter((c) => isThisClimb(climb, c));
      if (rows.length === 0) return [];
      const d = new Date(s.start_at);
      const tries = t("tally.tryCount", { count: rows.reduce((n, c) => n + c.tries, 0) });
      return [
        {
          fingerprint: s.fingerprint,
          day: utcDate(s.start_at),
          month: monthShortName(d.getUTCMonth() + 1),
          dayOfMonth: String(d.getUTCDate()),
          triesLabel: rows.some((c) => c.kind === "send")
            ? `${tries} · ${t("common.sent")}`
            : tries,
          note: rows.find((c) => c.note !== null)?.note ?? null,
        },
      ];
    });
}

export function climbDetailVM(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbDetailVM {
  const discipline = t(climb.discipline === "route" ? "common.route" : "common.boulder");
  const progress = dayCountLabel(climb);
  return {
    id: climb.id,
    name: climb.name,
    gradeLabel: climb.grade === null ? null : climbGradeLabel(climb),
    eyebrow: climb.area === null ? discipline : `${discipline} · ${climb.area.name}`,
    status:
      climb.sent_at === null
        ? climb.project
          ? `${t("climbs.working")} · ${progress}`
          : progress
        : `${t("climbs.sentOn", { date: dateLabel(climb.sent_at) })} · ${progress}`,
    working: climb.project,
    visits: climbVisits(climb, sessions),
  };
}
