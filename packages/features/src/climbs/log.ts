import type { ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import { t } from "../i18n";
import { disciplineOf, gradeOptions, utcDate } from "../log-session/transforms";
import type { GradeScale } from "../log-session/types";
import { gradeBins } from "../trends/filter";
import type { GradeBinVM, GradeRange } from "../trends/types";
import { monthKey, monthLabel, monthName } from "../sessions/months";
import { sendStyleOf, sendStyleText } from "./overview";
import { dateLabel } from "./projects";
import { climbDraftGrade, climbGradeLabel } from "./transforms";

export type ClimbStatusFilter = "all" | "projects" | "sent" | "notYet";

export const CLIMB_STATUSES: readonly ClimbStatusFilter[] = ["all", "projects", "sent", "notYet"];

/** A grade range on one scale's ladder, both ends inclusive. */
export type GradeFilter = { scale: GradeScale; from: string; to: string };

export type ClimbPillKind = "flash" | "onsight" | "sent" | "project" | "tries";

export type ClimbLogRowVM = {
  id: string;
  gradeLabel: string;
  name: string;
  meta: string;
  pill: { kind: ClimbPillKind; label: string };
};

/** `label` is null for the projects pinned above the months. */
export type ClimbLogGroupVM = { key: string; label: string | null; rows: ClimbLogRowVM[] };

export type ClimbLogVM = { counts: Record<ClimbStatusFilter, number>; groups: ClimbLogGroupVM[] };

export type ClimbLogQuery = { query: string; grade: GradeFilter | null; status: ClimbStatusFilter };

/** Typing finds a climb by its name, its crag or its grade: "6b+" finds the 6B+ climbs. */
export function matchesClimbSearch(climb: ClimbSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return [climb.name, climb.area?.name ?? "", climb.grade === null ? "" : climbGradeLabel(climb)]
    .map((s) => s.toLowerCase())
    .some((s) => s.includes(q));
}

/** In the range's discipline and between its grades, read on the range's own scale. */
export function inGradeRange(climb: ClimbSummary, filter: GradeFilter): boolean {
  if (climb.grade === null || climb.discipline !== disciplineOf(filter.scale)) return false;
  const ladder = gradeOptions(filter.scale);
  const at = ladder.indexOf(climbDraftGrade(climb, filter.scale));
  const [lo, hi] = [ladder.indexOf(filter.from), ladder.indexOf(filter.to)].sort((a, b) => a - b);
  return at >= 0 && lo !== undefined && hi !== undefined && at >= lo && at <= hi;
}

export function gradeFilterLabel(filter: GradeFilter): string {
  return filter.from === filter.to
    ? filter.from
    : t("climbs.gradeRange", { from: filter.from, to: filter.to });
}

/** How many of the climbs sit at each grade of the scale's ladder; a bin's rank is its place on it. */
export function climbGradeBins(climbs: readonly ClimbSummary[], scale: GradeScale): GradeBinVM[] {
  const ladder = gradeOptions(scale);
  const counts = new Map<number, number>();
  for (const c of climbs) {
    if (c.grade === null || c.discipline !== disciplineOf(scale)) continue;
    const rank = ladder.indexOf(climbDraftGrade(c, scale));
    if (rank >= 0) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }
  return gradeBins(counts, (rank) => ladder[rank] ?? "");
}

export function gradeFilterOf(scale: GradeScale, range: GradeRange): GradeFilter {
  const ladder = gradeOptions(scale);
  return { scale, from: ladder[range.lo] ?? "", to: ladder[range.hi] ?? "" };
}

export function gradeRangeOf(filter: GradeFilter): GradeRange {
  const ladder = gradeOptions(filter.scale);
  const [lo = -1, hi = -1] = [ladder.indexOf(filter.from), ladder.indexOf(filter.to)].sort(
    (a, b) => a - b
  );
  return { lo, hi };
}

const isProject = (c: ClimbSummary): boolean => c.project && c.sent_at === null;

export function climbStatus(climb: ClimbSummary): Exclude<ClimbStatusFilter, "all"> {
  if (climb.sent_at !== null) return "sent";
  return climb.project ? "projects" : "notYet";
}

function pillOf(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbLogRowVM["pill"] {
  if (isProject(climb)) return { kind: "project", label: t("common.project") };
  if (climb.sent_at === null)
    return { kind: "tries", label: t("tally.tryCount", { count: climb.attempts }) };
  const style = sendStyleOf(climb, sessions);
  return { kind: style === "redpoint" ? "sent" : style, label: sendStyleText(style) };
}

function metaOf(climb: ClimbSummary, today: string): string {
  const days = t("climbs.dayCount", { count: climb.sessions });
  const when = isProject(climb)
    ? `${days}, ${t("tally.tryCount", { count: climb.attempts })}`
    : climb.sessions > 1
      ? days
      : utcDate(climb.last_at) === today
        ? t("climbs.today")
        : dateLabel(climb.last_at);
  return climb.area === null ? when : `${climb.area.name} · ${when}`;
}

/**
 * Every climb, newest first by month, open projects pinned above them. Search and the grade
 * range narrow everything; the status picks among what is left, and the counts say how many.
 */
export function climbLog(
  climbs: readonly ClimbSummary[],
  sessions: readonly SessionWithClimbs[],
  { query, grade, status }: ClimbLogQuery,
  now: Date = new Date()
): ClimbLogVM {
  const found = climbs.filter(
    (c) => matchesClimbSearch(c, query) && (grade === null || inGradeRange(c, grade))
  );
  const counts = { all: found.length, projects: 0, sent: 0, notYet: 0 };
  for (const c of found) counts[climbStatus(c)] += 1;
  const today = utcDate(now.toISOString());
  const row = (c: ClimbSummary): ClimbLogRowVM => ({
    id: c.id,
    gradeLabel: climbGradeLabel(c),
    name: c.name,
    meta: metaOf(c, today),
    pill: pillOf(c, sessions),
  });
  const shown = found
    .filter((c) => status === "all" || climbStatus(c) === status)
    .sort((a, b) => b.last_at.localeCompare(a.last_at));
  const groups: ClimbLogGroupVM[] = [];
  const pinned = shown.filter(isProject);
  if (pinned.length > 0) groups.push({ key: "pinned", label: null, rows: pinned.map(row) });
  for (const c of shown.filter((x) => !isProject(x))) {
    const at = new Date(c.last_at);
    const [year, month] = [at.getUTCFullYear(), at.getUTCMonth() + 1];
    const key = monthKey(year, month);
    const last = groups.at(-1);
    if (last?.key === key) last.rows.push(row(c));
    else
      groups.push({
        key,
        label: year === now.getUTCFullYear() ? monthName(month) : monthLabel(year, month),
        rows: [row(c)],
      });
  }
  return { counts, groups };
}
