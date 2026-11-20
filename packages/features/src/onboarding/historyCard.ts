import { climbDiscipline, climbRank, effortGrade, isEndurance } from "@sendtally/core";
import type { ImportSession } from "@sendtally/core/import";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbingInsightsVM,
  mainDiscipline,
  type ClimbingInsightsVM,
  type InsightsSession,
} from "../climbs/insights";
import { formatNumber, t } from "../i18n";
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
  /** Calendar years from the first climb to the last, counting both. */
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
  scales: GradeScales
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
  const until = climbed.length === 0 ? null : Math.max(...climbed.map(yearOf));
  const byYear = hardestByYear(climbed, discipline, scales);
  const peak = Math.max(-1, ...byYear.map((y) => y.rank));
  return {
    discipline,
    stats,
    climbs: climbed.reduce((n, s) => n + s.climbs.length, 0),
    sessions: climbed.length,
    days: new Set(climbed.map((s) => s.start_at.slice(0, 10))).size,
    since,
    years: since === null || until === null ? 0 : until - since + 1,
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

/** The card's line beside its label: how many climbs, and since when once that spans years. */
export function cardMeta(card: HistoryCardVM): string {
  if (card.climbs === 0) return "";
  if (card.years > 1 && card.since !== null)
    return t("onboarding.history.card.climbsSince", { count: card.climbs, year: card.since });
  return `${formatNumber(card.climbs)} ${t("onboarding.history.reveal.climbsWord", { count: card.climbs })}`;
}

/** What the next climbs add, split round the count the card draws in bold. */
export type NextUnlock = { before: string; more: string; after: string } | { text: string };

export function nextUnlock(climbs: number): NextUnlock {
  if (climbs === 0) return { text: t("onboarding.history.card.empty") };
  if (climbs >= 5) return { text: t("onboarding.history.card.keepGoing") };
  const left = climbs < 3 ? 3 - climbs : 5 - climbs;
  const more = t("onboarding.history.card.more", { count: left });
  const key =
    climbs < 3 ? "onboarding.history.card.nextAverage" : "onboarding.history.card.nextYears";
  const [before = "", after = ""] = t(key, { more: "\u0000" }).split("\u0000");
  return { before, more, after };
}

/** Under the reveal's count: sessions and years for a file, the years by hand, else "and counting". */
export function revealLine(card: HistoryCardVM, imported: boolean): string {
  const since = card.since ?? 0;
  if (imported)
    return [
      t("sessions.sessionCount", { count: card.sessions }),
      t("onboarding.history.reveal.yearsSince", { count: card.years, year: since }),
    ].join(" · ");
  return card.years > 1
    ? t("onboarding.history.reveal.acrossYears", { count: card.years, year: since })
    : t("onboarding.history.reveal.andCounting");
}

/** H5's title and rows, counted from the user's own climbs (T25 option A). */
export function keepCopy(card: HistoryCardVM): {
  title: string;
  body: string;
  rows: { eyebrow: string; text: string }[];
} {
  const sent = card.stats.pyramid.filter((r) => r.inner > 0);
  const hi = sent[0]?.gradeLabel;
  const lo = sent.at(-1)?.gradeLabel;
  const count = card.stats.sends;
  const sends =
    hi === undefined || lo === undefined
      ? t("climbs.sendsWord", { count })
      : hi === lo
        ? t("onboarding.membership.history.sendsAt", { count, grade: hi })
        : t("onboarding.membership.history.sendsRange", { count, from: lo, to: hi });
  const hardest = card.stats.hardest;
  return {
    title: t("onboarding.membership.history.title", { count: Math.max(1, card.years) }),
    body: t("onboarding.membership.history.body"),
    rows: [
      { eyebrow: t("climbs.sendsByGrade"), text: sends },
      ...(hardest === null || card.hardestYear === null
        ? []
        : [
            {
              eyebrow: t("onboarding.history.card.hardestByYear"),
              text:
                card.years > 1 && card.since !== null
                  ? t("onboarding.membership.history.hardestBackTo", {
                      grade: hardest.gradeLabel,
                      year: card.hardestYear,
                      since: card.since,
                    })
                  : t("onboarding.membership.history.hardestIn", {
                      grade: hardest.gradeLabel,
                      year: card.hardestYear,
                    }),
            },
          ]),
      {
        eyebrow: t("onboarding.membership.history.everyRange"),
        text: t("onboarding.membership.history.everyRangeBody"),
      },
    ],
  };
}
