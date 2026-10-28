import { daysBetween } from "./calendar";
import { plannedWork } from "./protocol";
import type { CalendarDate, HangSession } from "./types";

export const byDate = (a: HangSession, b: HangSession): number =>
  a.date.localeCompare(b.date) || a.id.localeCompare(b.id);

/** One series per workout and grip, oldest first. */
export function seriesFor<T extends HangSession>(
  sessions: readonly T[],
  workoutId: string,
  gripId: string
): T[] {
  return sessions.filter((s) => s.workoutId === workoutId && s.gripId === gripId).sort(byDate);
}

/** What a grip's loads compare on: the edge and the hang time. A ground pull has one per grip. */
export type GripSetup = { edgeMm: number; hangS: number };

const PULL_SETUP: GripSetup = { edgeMm: 0, hangS: 0 };

export const setupOf = (s: Pick<HangSession, "edgeMm" | "protocol">): GripSetup =>
  s.protocol.kind === "pull" || s.edgeMm === 0
    ? PULL_SETUP
    : { edgeMm: s.edgeMm, hangS: s.protocol.hangS };

export const sameSetup = (a: GripSetup, b: GripSetup): boolean =>
  a.edgeMm === b.edgeMm && a.hangS === b.hangS;

export const isPullSetup = (setup: GripSetup): boolean => setup.edgeMm === 0;

const isComplete = (s: Pick<HangSession, "pct">): boolean => s.pct >= 100;

/** One grip across every workout, oldest first; on one setup when given. */
export function gripSeries<T extends HangSession>(
  sessions: readonly T[],
  gripId: string,
  setup?: GripSetup
): T[] {
  return sessions
    .filter((s) => s.gripId === gripId && (setup === undefined || sameSetup(setupOf(s), setup)))
    .sort(byDate);
}

/** The setups sessions ran on, the most used first, then the most recent. */
export function setupsOf(sessions: readonly HangSession[], gripId?: string): GripSetup[] {
  const used = new Map<string, { setup: GripSetup; count: number; last: string }>();
  for (const s of [...sessions].sort(byDate)) {
    if (gripId !== undefined && s.gripId !== gripId) continue;
    const setup = setupOf(s);
    const key = `${setup.edgeMm}:${setup.hangS}`;
    used.set(key, { setup, count: (used.get(key)?.count ?? 0) + 1, last: s.date });
  }
  return [...used.values()]
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .map((u) => u.setup);
}

/** The heaviest completed load on the session's grip and setup before it; null when none was. */
export function previousBest(
  sessions: readonly HangSession[],
  session: HangSession
): number | null {
  const before = gripSeries(sessions, session.gripId, setupOf(session)).filter(
    (s) => byDate(s, session) < 0 && isComplete(s)
  );
  return before.length === 0 ? null : Math.max(...before.map((s) => s.loadKg));
}

/** How far a completed session beat the best before it on its grip and setup; null when it did not. */
export function newBestBy(sessions: readonly HangSession[], session: HangSession): number | null {
  const previous = previousBest(sessions, session);
  return isComplete(session) && previous !== null && session.loadKg > previous
    ? session.loadKg - previous
    : null;
}

export type Milestone =
  | { kind: "first"; session: HangSession }
  | { kind: "over"; kg: number; session: HangSession }
  | { kind: "edge"; session: HangSession };

const roundStep = (setup: GripSetup): number => (isPullSetup(setup) ? 10 : 5);

/**
 * Derived, never stored, oldest first: the first session; each first completed load over a
 * round number on its setup (every 5 kg, 10 kg for pulls); and each first bodyweight-or-better
 * hang on an edge smaller than any held that way before.
 */
export function milestones(series: readonly HangSession[]): Milestone[] {
  const ordered = [...series].sort(byDate);
  const first = ordered[0];
  if (first === undefined) return [];
  const found: Milestone[] = [{ kind: "first", session: first }];
  const bestBySetup = new Map<string, number>();
  let smallestEdge = Infinity;
  for (const s of ordered) {
    if (!isComplete(s)) continue;
    const setup = setupOf(s);
    const key = `${setup.edgeMm}:${setup.hangS}`;
    const best = bestBySetup.get(key);
    const step = roundStep(setup);
    const mark = Math.floor(s.loadKg / step) * step;
    if (best !== undefined && mark > best) found.push({ kind: "over", kg: mark, session: s });
    bestBySetup.set(key, Math.max(best ?? -Infinity, s.loadKg));
    if (isPullSetup(setup) || s.loadKg < 0) continue;
    if (s.edgeMm < smallestEdge && smallestEdge !== Infinity)
      found.push({ kind: "edge", session: s });
    smallestEdge = Math.min(smallestEdge, s.edgeMm);
  }
  return found;
}

export type TrendSummary = {
  first: number;
  last: number;
  best: number;
  topAttempt: HangSession | null;
  avgRpe: number | null;
  avgPct: number;
  work: number;
  weeks: number;
};

export function summarise(
  series: readonly HangSession[],
  today: CalendarDate
): TrendSummary | null {
  const oldest = series[0];
  if (oldest === undefined) return null;
  const complete = series.filter((s) => s.pct >= 100);
  const counted = (complete.length > 0 ? complete : series).map((s) => s.loadKg);
  const best = Math.max(...counted);
  const topAttempt =
    series.filter((s) => s.pct < 100 && s.loadKg > best).sort((a, b) => b.loadKg - a.loadKg)[0] ??
    null;
  const rpes = series.flatMap((s) => (s.rpe === null ? [] : [s.rpe]));
  return {
    first: counted[0] ?? 0,
    last: counted[counted.length - 1] ?? 0,
    best,
    topAttempt,
    avgRpe: rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null,
    avgPct: Math.round(series.reduce((a, s) => a + s.pct, 0) / series.length),
    work: Math.round(series.reduce((a, s) => a + (plannedWork(s.protocol) * s.pct) / 100, 0)),
    weeks: Math.max(1, Math.round(daysBetween(oldest.date, today) / 7)),
  };
}
