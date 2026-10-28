import {
  climbDiscipline,
  climbRank,
  dominantDiscipline,
  isEndurance,
  type Discipline,
  type GradedClimb,
} from "@sendtally/core";
import type { SessionWithClimbs } from "@sendtally/api-client";
import { gradeFormatterFor } from "../sessions/grades";

/** One grade of a centred bar: `inner` drawn dark in the middle, `outer` split either side. */
export type PyramidRow = { gradeLabel: string; inner: number; outer: number; countLabel: string };

type Counted = { rank: number; inner: boolean };

export function rowsOf(
  counted: readonly Counted[],
  label: (rank: number) => string,
  countLabel: (inner: number, all: number) => string
): PyramidRow[] {
  const byRank = new Map<number, { inner: number; all: number }>();
  for (const c of counted) {
    if (c.rank < 0) continue;
    const row = byRank.get(c.rank) ?? { inner: 0, all: 0 };
    row.all += 1;
    if (c.inner) row.inner += 1;
    byRank.set(c.rank, row);
  }
  return [...byRank.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rank, { inner, all }]) => ({
      gradeLabel: label(rank),
      inner,
      outer: all - inner,
      countLabel: countLabel(inner, all),
    }));
}

const graded = <T extends GradedClimb>(climbs: readonly T[]): T[] =>
  climbs.filter((c) => !isEndurance(c));

/** A session's climbs by grade in its main discipline: sent in the middle, not yet either side. */
export function sessionPyramid(
  climbs: ReadonlyArray<GradedClimb & { kind: "send" | "attempt" }>
): PyramidRow[] {
  const discipline = dominantDiscipline(climbs);
  const mine = graded(climbs).filter((c) => climbDiscipline(c) === discipline);
  const format = gradeFormatterFor(mine, discipline);
  return rowsOf(
    mine.map((c) => ({ rank: climbRank(c), inner: c.kind === "send" })),
    format.label,
    (sent, all) => `${sent}/${all}`
  );
}

const yearOf = (iso: string): number => new Date(iso).getUTCFullYear();

export function outdoorSends(
  sessions: readonly SessionWithClimbs[],
  discipline: Discipline
): Array<GradedClimb & { at: string }> {
  return sessions
    .filter((s) => s.location === "outdoor")
    .flatMap((s) =>
      graded(s.climbs)
        .filter((c) => c.kind === "send" && climbDiscipline(c) === discipline)
        .map((c) => ({ ...c, at: s.start_at }))
    );
}

/**
 * Outdoor sends by grade: this year in the middle, earlier years either side, with the all-time
 * count at the end. Without the earlier years, only this year is drawn and counted.
 */
export function outdoorPyramid(
  sessions: readonly SessionWithClimbs[],
  discipline: Discipline,
  year: number,
  allTime: boolean
): PyramidRow[] {
  const sends = outdoorSends(sessions, discipline).filter((c) => allTime || yearOf(c.at) === year);
  const format = gradeFormatterFor(sends, discipline);
  return rowsOf(
    sends.map((c) => ({ rank: climbRank(c), inner: yearOf(c.at) === year })),
    format.label,
    (_inner, all) => String(all)
  );
}
