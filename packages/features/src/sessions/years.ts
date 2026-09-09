import type { SessionRow } from "@sendtally/api-client";
import { sessionMonths, type SessionMonth } from "./months";

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

export function sessionYearGroups(sessions: SessionRow[]): SessionYear[] {
  const byYear = new Map<number, SessionMonth[]>();
  for (const month of sessionMonths(sessions)) {
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
      totals: sessionTotals(months.flatMap((m) => m.sessions)),
    }));
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

export function countLabel(count: number): string {
  return count === 1 ? "1 SESSION" : `${count} SESSIONS`;
}

export function totalsLabel(totals: SessionGroupTotals): string {
  const parts = [countLabel(totals.count), durationLabel(totals.minutes).toUpperCase()];
  if (totals.topGrade >= 0) parts.push(`TOP ${totals.topGradeLabel ?? `V${totals.topGrade}`}`);
  return parts.join(" · ");
}
