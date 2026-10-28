import { climbDiscipline, climbRank, isEndurance, type Discipline } from "@sendtally/core";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { utcDate } from "../log-session/transforms";
import { gradeFormatterFor } from "../sessions/grades";
import { bucketsFor, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
import { dateLabel } from "./projects";
import { rowsOf, type PyramidRow } from "./pyramid";
import { climbKey } from "./transforms";

/** Where the climbing was: anywhere, outside at a crag, or inside at a gym. */
export type ClimbPlaceFilter = "all" | "outdoor" | "indoor";

export const CLIMB_PLACES: readonly ClimbPlaceFilter[] = ["all", "outdoor", "indoor"];

export type ClimbingInsightsFilter = {
  range: TrendRange;
  discipline: Discipline;
  place: ClimbPlaceFilter;
};

export type ClimbingInsightsVM = {
  daysOutside: number;
  sends: number;
  flashed: number;
  projects: number;
  pyramid: PyramidRow[];
  hardest: { gradeLabel: string; name: string | null; dateLabel: string } | null;
};

type Tried = { rank: number; name: string; sent: boolean; flashed: boolean; sentAt: string | null };

const graded = (c: SessionClimb): boolean => !isEndurance(c) && climbRank(c) >= 0;

const placed = (s: SessionWithClimbs, place: ClimbPlaceFilter): boolean =>
  place === "all" || (place === "outdoor") === (s.location === "outdoor");

/** The discipline with the most graded climbs logged, boulder on a tie. */
export function mainDiscipline(sessions: readonly SessionWithClimbs[]): Discipline {
  const climbs = sessions.flatMap((s) => s.climbs.filter(graded));
  const routes = climbs.filter((c) => climbDiscipline(c) === "route").length;
  return routes * 2 > climbs.length ? "route" : "boulder";
}

/**
 * Each climb tried in the window once: a named climb is one climb however many sessions it
 * took, sent if any of them sent it; an unnamed one counts on its own.
 */
function triedIn(sessions: readonly SessionWithClimbs[], discipline: Discipline): Tried[] {
  const byKey = new Map<string, Tried>();
  const ordered = [...sessions].sort((a, b) => a.start_at.localeCompare(b.start_at));
  for (const s of ordered) {
    s.climbs.forEach((c, i) => {
      if (!graded(c) || climbDiscipline(c) !== discipline) return;
      const key = climbKey(c.name) === "" ? `${s.fingerprint}:${i}` : climbKey(c.name);
      const held = byKey.get(key);
      const send = c.kind === "send";
      byKey.set(key, {
        rank: climbRank(c),
        name: c.name.trim(),
        sent: (held?.sent ?? false) || send,
        flashed: (held?.flashed ?? false) || (send && c.style !== "redpoint"),
        sentAt: held?.sentAt ?? (send ? s.start_at : null),
      });
    });
  }
  return [...byKey.values()];
}

/** Climbing over a range, in one discipline and place: the tiles, the pyramid and the top send. */
export function climbingInsightsVM(
  sessions: readonly SessionWithClimbs[],
  climbs: readonly ClimbSummary[],
  filter: ClimbingInsightsFilter,
  now: Date = new Date()
): ClimbingInsightsVM {
  const first =
    sessions.length === 0 ? null : Math.min(...sessions.map((s) => Date.parse(s.start_at)));
  const { start, end } = windowOf(bucketsFor(filter.range, now, first));
  const inRange = sessions.filter((s) => {
    const at = Date.parse(s.start_at);
    return at >= start && at < end;
  });
  const shown = inRange.filter((s) => placed(s, filter.place));
  const tried = triedIn(shown, filter.discipline);
  const sent = tried.filter((c) => c.sent);
  const format = gradeFormatterFor(
    shown.flatMap((s) => s.climbs),
    filter.discipline
  );
  const hardest = [...sent].sort(
    (a, b) => b.rank - a.rank || (a.sentAt ?? "").localeCompare(b.sentAt ?? "")
  )[0];
  return {
    daysOutside: new Set(
      inRange.filter((s) => s.location === "outdoor").map((s) => utcDate(s.start_at))
    ).size,
    sends: sent.length,
    flashed: sent.filter((c) => c.flashed).length,
    projects: climbs.filter(
      (c) => c.project && c.sent_at === null && c.discipline === filter.discipline
    ).length,
    pyramid: rowsOf(
      tried.map((c) => ({ rank: c.rank, inner: c.sent })),
      format.label,
      (inner, all) => `${inner}/${all}`
    ),
    hardest:
      hardest === undefined
        ? null
        : {
            gradeLabel: format.label(hardest.rank),
            name: hardest.name === "" ? null : hardest.name,
            dateLabel: dateLabel(hardest.sentAt ?? ""),
          },
  };
}
