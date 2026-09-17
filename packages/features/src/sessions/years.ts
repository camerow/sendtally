import type { SessionRow } from "@sendtally/api-client";
import { t } from "../i18n";
import { flatLog } from "../journal/transforms";
import type { LogItem } from "../journal/types";
import { logMonths, type SessionMonth } from "./months";

export type SessionGroupTotals = {
  count: number;
  minutes: number;
  topGrade: number;
  topGradeLabel: string | null;
};

export type SessionYear = {
  year: number;
  label: string;
  months: SessionMonth[];
  totals: SessionGroupTotals;
};

export function sessionMinutes(session: SessionRow): number {
  const ms = Date.parse(session.end_at) - Date.parse(session.start_at);
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 60_000)) : 0;
}

function sessionTop(session: SessionRow): { grade: number; label: string | null } {
  if (session.top_send_grade > session.top_grade) {
    return { grade: session.top_send_grade, label: session.top_send_grade_label };
  }
  return { grade: session.top_grade, label: session.top_grade_label };
}

export function sessionsIn(items: LogItem[]): SessionRow[] {
  return flatLog(items).flatMap((item) => (item.type === "session" ? [item.session] : []));
}

export function sessionTotals(sessions: SessionRow[]): SessionGroupTotals {
  return sessions.reduce<SessionGroupTotals>(
    (totals, session) => {
      const top = sessionTop(session);
      const harder = top.grade > totals.topGrade;
      return {
        count: totals.count + 1,
        minutes: totals.minutes + sessionMinutes(session),
        topGrade: harder ? top.grade : totals.topGrade,
        topGradeLabel: harder ? top.label : totals.topGradeLabel,
      };
    },
    { count: 0, minutes: 0, topGrade: -1, topGradeLabel: null }
  );
}

export function logYearGroups(items: LogItem[]): SessionYear[] {
  const byYear = new Map<number, SessionMonth[]>();
  for (const month of logMonths(items)) {
    const existing = byYear.get(month.year);
    if (existing) existing.push(month);
    else byYear.set(month.year, [month]);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      label: String(year),
      months,
      totals: sessionTotals(sessionsIn(months.flatMap((m) => m.items))),
    }));
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = `${h}${t("sessions.hoursShort")}`;
  if (h === 0) return `${m}${t("sessions.minutesShort")}`;
  return m === 0 ? hours : `${hours} ${String(m).padStart(2, "0")}${t("sessions.minutesShort")}`;
}

export function countLabel(count: number): string {
  return t("sessions.sessionCount", { count });
}

/**
 * What a log group carries, saying only what is actually in it: a month of
 * writing should not announce "0 sessions".
 */
export function logCountLabel(items: LogItem[]): string {
  const sessions = sessionsIn(items).length;
  const entries = flatLog(items).length - sessions;
  const parts = [
    sessions === 0 && entries > 0 ? null : countLabel(sessions),
    entries === 0 ? null : t("journal.entryCount", { count: entries }),
  ].filter((part) => part !== null);
  return parts.join(" · ");
}

export function logTotalsLabel(items: LogItem[]): string {
  const sessions = sessionsIn(items);
  if (sessions.length === 0) return logCountLabel(items);
  const entries = flatLog(items).length - sessions.length;
  const totals = totalsLabel(sessionTotals(sessions));
  return entries === 0 ? totals : `${totals} · ${t("journal.entryCount", { count: entries })}`;
}

export function totalsLabel(totals: SessionGroupTotals): string {
  const parts = [countLabel(totals.count), durationLabel(totals.minutes)];
  if (totals.topGrade >= 0) {
    parts.push(t("sessions.topGrade", { grade: totals.topGradeLabel ?? `V${totals.topGrade}` }));
  }
  return parts.join(" · ");
}
