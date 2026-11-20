import { climbDiscipline, climbRank, effortGrade, isEndurance } from "@sendtally/core";
import type { ImportSession } from "@sendtally/core/import";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbingInsightsVM,
  mainDiscipline,
  type ClimbingInsightsVM,
  type InsightsSession,
} from "../climbs/insights";
import { localDate } from "../log-session/liveSession";
import { gradeFormatter, type GradeScales } from "../sessions/grades";
import type { Discipline } from "../trends/types";

export type HardestInYear = { year: number; gradeLabel: string; rank: number };

/** The history path's dark card: what Stats shows of the log, all time, in its main discipline. */
export type HistoryCardVM = {
  discipline: Discipline;
  stats: ClimbingInsightsVM;
  climbs: number;
  sessions: number;
  days: number;
  since: number | null;
  /** Calendar years from the first climb to this one, counting both. */
  years: number;
  hardestYear: number | null;
  byYear: HardestInYear[];
};

const yearOf = (s: Pick<InsightsSession, "start_at">): number => Number(s.start_at.slice(0, 4));

/** Each year's hardest send, oldest year first; the first year to reach the top grade sets it. */
function hardestByYear(
  sessions: readonly InsightsSession[],
  discipline: Discipline,
  scales: GradeScales
): HardestInYear[] {
  const top = new Map<number, number>();
  for (const s of sessions)
    for (const c of s.climbs) {
      if (c.kind !== "send" || isEndurance(c) || climbDiscipline(c) !== discipline) continue;
      const rank = climbRank(c);
      if (rank >= 0) top.set(yearOf(s), Math.max(rank, top.get(yearOf(s)) ?? -1));
    }
  const label = gradeFormatter(discipline, scales).label;
  return [...top]
    .sort(([a], [b]) => a - b)
    .map(([year, rank]) => ({ year, rank, gradeLabel: label(rank) }));
}

export function historyCard(
  sessions: readonly InsightsSession[],
  climbs: readonly ClimbSummary[],
  scales: GradeScales,
  now: Date = new Date()
): HistoryCardVM {
  const discipline = mainDiscipline(sessions);
  const stats = climbingInsightsVM(sessions, climbs, {
    range: "all",
    discipline,
    place: "all",
    scales,
  });
  const climbed = sessions.filter((s) => s.climbs.length > 0);
  const since = climbed.length === 0 ? null : Math.min(...climbed.map(yearOf));
  const byYear = hardestByYear(climbed, discipline, scales);
  const peak = Math.max(-1, ...byYear.map((y) => y.rank));
  return {
    discipline,
    stats,
    climbs: climbed.reduce((n, s) => n + s.climbs.length, 0),
    sessions: climbed.length,
    days: new Set(climbed.map((s) => s.start_at.slice(0, 10))).size,
    since,
    years: since === null ? 0 : now.getFullYear() - since + 1,
    hardestYear: byYear.find((y) => y.rank === peak)?.year ?? null,
    byYear,
  };
}

/** A file's sessions as the insights read logged ones, so the card draws the file before it is saved. */
export const importedInsights = (sessions: readonly ImportSession[]): InsightsSession[] =>
  sessions.map((s, i) => ({
    fingerprint: `import-${i}`,
    start_at: `${s.date}T12:00:00Z`,
    location: s.location,
    climbs: s.climbs.map((c) => ({
      name: c.name,
      kind: c.kind,
      style: c.style ?? "redpoint",
      tries: c.tries,
      grade: c.grade,
      vGrade: effortGrade(c.grade),
    })),
  }));

/** A climb given only a year lands on 1 July of it, or today while 1 July is still ahead (T29). */
export function yearDate(year: number, now: Date = new Date()): string {
  const july = `${year}-07-01`;
  const today = localDate(now);
  return july > today ? today : july;
}
