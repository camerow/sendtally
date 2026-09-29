import { climbDiscipline, climbRank, enduranceTotals, type Discipline } from "@sendtally/core";
import type { Gym, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { climbKey } from "../climbs/transforms";
import { circuitLabel } from "../gyms/transforms";
import { isUnscored } from "../sessions/meta";
import { UNTAGGED_KEY } from "../sessions/tags";
import { gradeFormatterFor } from "../sessions/grades";
import type { GradeRange, TrendFilter, TrendScope, TrendSetting } from "./types";

/** A logged climb with what trends need from its history: when, and whether it went first try. */
export type Rec = {
  climb: SessionClimb;
  discipline: Discipline;
  firstTry: boolean;
  onsight: boolean;
};

export type Row = {
  session: SessionWithClimbs;
  time: number;
  outdoor: boolean;
  hours: number;
  graded: Rec[];
  endurance: SessionClimb[];
};

/**
 * A send style says it outright. Rows from before styles existed fall back to a
 * first encounter: one try on a climb with nothing logged against its name before,
 * in this session or any earlier one.
 */
export function rowsOf(sessions: SessionWithClimbs[]): Row[] {
  const ordered = sessions
    .flatMap((session) => session.climbs.map((climb) => ({ session, climb })))
    .sort((a, b) => Date.parse(a.climb.time) - Date.parse(b.climb.time));
  const seen = new Set<string>();
  const firstTry = new Map<SessionClimb, Rec>();
  for (const { climb } of ordered) {
    if (climb.endurance !== undefined) continue;
    const key = climbKey(climb.name);
    const firstEncounter = key === "" || !seen.has(key);
    if (key !== "") seen.add(key);
    const sent = climb.kind === "send";
    const first =
      sent &&
      (climb.style === undefined
        ? firstEncounter && climb.tries <= 1
        : climb.style === "flash" || climb.style === "onsight");
    firstTry.set(climb, {
      climb,
      discipline: climbDiscipline(climb),
      firstTry: first,
      onsight: sent && climb.style === "onsight",
    });
  }
  return sessions
    .map((session) => {
      const time = Date.parse(session.start_at);
      return {
        session,
        time,
        outdoor: session.location === "outdoor",
        hours:
          session.times === "both" ? Math.max(0, Date.parse(session.end_at) - time) / 3_600_000 : 0,
        graded: session.climbs.flatMap((c) => {
          const rec = firstTry.get(c);
          return rec === undefined ? [] : [rec];
        }),
        endurance: session.climbs.filter((c) => c.endurance !== undefined),
      };
    })
    .sort((a, b) => a.time - b.time);
}

export function placeMatches(row: Row, setting: TrendSetting, gymId: string | null): boolean {
  if (gymId !== null) return row.session.gym_id === gymId;
  if (setting === "indoor") return !row.outdoor;
  if (setting === "outdoor") return row.outdoor;
  return true;
}

export function tagsMatch(row: Row, tags: string[]): boolean {
  if (tags.length === 0) return true;
  const { session } = row;
  if (session.tags.length === 0) return tags.includes(UNTAGGED_KEY);
  return session.tags.some((tag) => tags.includes(tag.slug));
}

/** The grade ladder a scope reads on. `rank` is null for a climb that is off it. */
export type Ladder = {
  scope: TrendScope;
  includes: (rec: Rec) => boolean;
  rank: (rec: Rec) => number | null;
  label: (rank: number) => string;
  average: (rank: number) => string;
};

function disciplineLadder(discipline: Discipline, rows: Row[]): Ladder {
  const format = gradeFormatterFor(
    rows.flatMap((r) => r.graded.map((g) => g.climb)),
    discipline
  );
  return {
    scope: discipline,
    includes: (rec) => rec.discipline === discipline,
    rank: (rec) => {
      if (rec.discipline !== discipline) return null;
      const rank = climbRank(rec.climb);
      return rank >= 0 ? rank : null;
    },
    label: format.label,
    average: format.average,
  };
}

/** A gym's circuits in ladder order, so a colour's rank is its place from easiest. */
export function circuitLadder(gym: Gym): Ladder {
  const circuits = [...gym.circuits].sort((a, b) => a.low - b.low || a.high - b.high);
  const index = new Map(circuits.map((c, i) => [c.id, i]));
  const name = (rank: number): string => {
    const circuit = circuits[Math.max(0, Math.min(circuits.length - 1, Math.round(rank)))];
    return circuit === undefined ? "-" : circuitLabel(circuit);
  };
  const rank = (rec: Rec): number | null => {
    const id = rec.climb.circuit?.id;
    return id === undefined ? null : (index.get(id) ?? null);
  };
  return {
    scope: "circuit",
    includes: (rec) => rank(rec) !== null,
    rank,
    label: name,
    average: name,
  };
}

export const ALL_LADDER: Ladder = {
  scope: "all",
  includes: () => true,
  rank: () => null,
  label: () => "-",
  average: () => "-",
};

export function disciplinesBySends(rows: Row[]): Discipline[] {
  const counts = { boulder: 0, route: 0 };
  for (const row of rows) {
    for (const rec of row.graded) {
      if (rec.climb.kind === "send" && climbRank(rec.climb) >= 0) counts[rec.discipline]++;
    }
  }
  return (["boulder", "route"] as const)
    .filter((d) => counts[d] > 0)
    .sort((a, b) => counts[b] - counts[a]);
}

export function ladderFor(filter: TrendFilter, rows: Row[], gyms: Gym[]): Ladder {
  const scope = filter.scope;
  if (scope === "all") return ALL_LADDER;
  if (scope === "circuit") {
    const gym = gyms.find((g) => g.id === filter.gymId && g.circuits.length > 0);
    if (gym !== undefined) return circuitLadder(gym);
  }
  const discipline =
    scope === "boulder" || scope === "route" ? scope : (disciplinesBySends(rows)[0] ?? "boulder");
  return disciplineLadder(discipline, rows);
}

export type Slice = {
  rows: Row[];
  ladder: Ladder;
  grade: GradeRange | null;
};

/** Place and tags narrow the sessions; scope and grade narrow the climbs inside them. */
export function sliceOf(filter: TrendFilter, rows: Row[], gyms: Gym[]): Slice {
  const ladder = ladderFor(filter, rows, gyms);
  return {
    rows: rows.filter(
      (r) => placeMatches(r, filter.setting, filter.gymId) && tagsMatch(r, filter.tags)
    ),
    ladder,
    grade: ladder.scope === "all" ? null : filter.grade,
  };
}

export function climbsIn(slice: Slice, row: Row): Rec[] {
  const { ladder, grade } = slice;
  return row.graded.filter((rec) => {
    if (!ladder.includes(rec)) return false;
    if (grade === null) return true;
    const rank = ladder.rank(rec);
    return rank !== null && rank >= grade.lo && rank <= grade.hi;
  });
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

export type Totals = {
  climbs: number;
  sends: number;
  attempts: number;
  boulders: number;
  routes: number;
  flashes: number;
  onsights: number;
  firstTry: number;
  hardest: number | null;
  avg: number | null;
  flashRate: number | null;
  tries: number | null;
  rpe: number | null;
  sessions: number;
  days: number;
  inside: number;
  outside: number;
  hours: number;
  laps: number;
  clean: number;
  moves: number;
  sendRanks: Array<{ rank: number; firstTry: boolean }>;
};

/**
 * A session counts once it has a climb in the slice. Without a grade filter an
 * endurance-only session counts too: its felt-like grade is not a send grade, so
 * laps belong to every discipline.
 */
export function totals(slice: Slice, start: number, end: number): Totals {
  const sessions: Row[] = [];
  const recs: Rec[] = [];
  let laps = 0;
  let clean = 0;
  let moves = 0;
  for (const row of slice.rows) {
    if (row.time < start || row.time >= end) continue;
    const mine = climbsIn(slice, row);
    if (mine.length === 0 && (slice.grade !== null || row.endurance.length === 0)) continue;
    sessions.push(row);
    recs.push(...mine);
    for (const climb of row.endurance) {
      const e = climb.endurance!;
      const tally = enduranceTotals(e);
      laps += tally.laps;
      clean += tally.clean;
      if (e.unit === "moves") moves += tally.done;
    }
  }
  const sent = recs.filter((r) => r.climb.kind === "send");
  const sendRanks = sent.flatMap((r) => {
    const rank = slice.ladder.rank(r);
    return rank === null ? [] : [{ rank, firstTry: r.firstTry }];
  });
  const firstTry = sent.filter((r) => r.firstTry).length;
  const days = new Map<number, boolean>();
  for (const row of sessions) {
    const day = Math.floor(row.time / 86_400_000);
    days.set(day, (days.get(day) ?? false) || row.outdoor);
  }
  const outside = [...days.values()].filter(Boolean).length;
  return {
    climbs: recs.length,
    sends: sent.length,
    attempts: recs.length - sent.length,
    boulders: recs.filter((r) => r.discipline === "boulder").length,
    routes: recs.filter((r) => r.discipline === "route").length,
    flashes: sent.filter((r) => r.firstTry && !r.onsight).length,
    onsights: sent.filter((r) => r.onsight).length,
    firstTry,
    hardest: sendRanks.length === 0 ? null : Math.max(...sendRanks.map((s) => s.rank)),
    avg: mean(sendRanks.map((s) => s.rank)),
    flashRate: sent.length === 0 ? null : (firstTry / sent.length) * 100,
    tries: mean(sent.map((r) => r.climb.tries)),
    rpe: mean(sessions.filter((r) => !isUnscored(r.session)).map((r) => r.session.rpe)),
    sessions: sessions.length,
    days: days.size,
    inside: days.size - outside,
    outside,
    hours: sessions.reduce((a, r) => a + r.hours, 0),
    laps,
    clean,
    moves,
    sendRanks,
  };
}
