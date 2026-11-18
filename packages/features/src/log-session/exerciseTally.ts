import type { SetClimb, SetDone } from "@sendtally/core/hang";
import { tallyDraft } from "./tally";
import type { ClimbDraft, ExerciseTally, LogSessionDraft, WallTime } from "./types";

/** What an exercise's tally is started from: everything but where it has got to. */
export type ExerciseTallyStart = Omit<ExerciseTally, "set" | "setStartedAt">;

const setOf = (c: ClimbDraft): number => c.set ?? 1;

const climbsOfItem = (climbs: readonly ClimbDraft[], item: number): ClimbDraft[] =>
  climbs.filter((c) => c.item === item);

/** The set an item's tally resumes at: the one after the last set with a climb in it. */
export const nextSet = (climbs: readonly ClimbDraft[], item: number): number =>
  Math.max(0, ...climbsOfItem(climbs, item).map(setOf)) + 1;

export const allSetsDone = (ex: ExerciseTally): boolean => ex.set > ex.sets;

/** The set a climb logged now goes in: the current one, or the last once every set is done. */
export const climbingSet = (ex: ExerciseTally): number => Math.min(ex.set, ex.sets);

/** The climbs of the set being climbed. */
export const setClimbs = (draft: LogSessionDraft, ex: ExerciseTally): ClimbDraft[] =>
  climbsOfItem(draft.climbs, ex.item).filter((c) => setOf(c) === climbingSet(ex));

/**
 * The tally scoped to one exercise, on the set it resumes at, its clock from now. Climbs
 * logged earlier in the run, for this item or another, stay.
 */
export function startExercise(
  draft: LogSessionDraft | null,
  start: ExerciseTallyStart,
  now: Date
): LogSessionDraft {
  const base = draft === null ? tallyDraft(now) : withExerciseDone(draft, now);
  return {
    ...base,
    startedAt: now.toISOString(),
    exercise: { ...start, set: nextSet(base.climbs, start.item) },
  };
}

/** Seconds left on the wall in the set, the whole time before its first grade; null without a time. */
export function wallLeft(ex: ExerciseTally, now: Date): number | null {
  if (ex.onS === undefined) return null;
  const started = Date.parse(ex.setStartedAt ?? "");
  if (Number.isNaN(started)) return ex.onS;
  return Math.min(ex.onS, Math.max(0, ex.onS - Math.floor((now.getTime() - started) / 1000)));
}

/** A grade picked in a time set that has not started starts its clock. */
export function withWallStarted(draft: LogSessionDraft, now: Date): LogSessionDraft {
  const ex = draft.exercise;
  if (ex?.onS === undefined || ex.setStartedAt !== undefined || allSetsDone(ex)) return draft;
  return { ...draft, exercise: { ...ex, setStartedAt: now.toISOString() } };
}

/** A climb just logged joins the exercise's item and the set being climbed. */
export function withExerciseClimb(draft: LogSessionDraft, key: string): LogSessionDraft {
  const ex = draft.exercise;
  if (ex === undefined) return draft;
  const tag = { item: ex.item, set: climbingSet(ex) };
  return { ...draft, climbs: draft.climbs.map((c) => (c.key === key ? { ...c, ...tag } : c)) };
}

/** A logged climb pressed the wrong way: a send becomes an attempt, an attempt a send. */
export function withClimbFlipped(draft: LogSessionDraft, key: string): LogSessionDraft {
  if (!draft.climbs.some((c) => c.key === key)) return draft;
  const flip = (c: ClimbDraft): ClimbDraft =>
    c.key === key ? { ...c, kind: c.kind === "send" ? "attempt" : "send" } : c;
  return { ...draft, climbs: draft.climbs.map(flip) };
}

/** Whether the set being climbed is over: its last climb logged, or its time on the wall up. */
export function setOver(draft: LogSessionDraft, now: Date): boolean {
  const ex = draft.exercise;
  if (ex === undefined || allSetsDone(ex)) return false;
  if (ex.climbs !== undefined) return setClimbs(draft, ex).length >= ex.climbs;
  return ex.setStartedAt !== undefined && wallLeft(ex, now) === 0;
}

/** Only a set whose clock started gets a time on the wall. */
function wallTimesAt(draft: LogSessionDraft, now: Date): WallTime[] | undefined {
  const ex = draft.exercise;
  const left = ex === undefined ? null : wallLeft(ex, now);
  if (ex?.onS === undefined || ex.setStartedAt === undefined || left === null)
    return draft.wallTimes;
  return [...(draft.wallTimes ?? []), { item: ex.item, set: ex.set, onS: ex.onS - left }];
}

/** The set after, and the rest before it: none after the last. */
export function withSetEnded(
  draft: LogSessionDraft,
  now: Date
): { draft: LogSessionDraft; restS: number } {
  const ex = draft.exercise;
  if (ex === undefined) return { draft, restS: 0 };
  const { setStartedAt: _ended, ...rest } = ex;
  const set = ex.set + 1;
  const wallTimes = wallTimesAt(draft, now);
  return {
    draft: {
      ...draft,
      exercise: { ...rest, set },
      ...(wallTimes === undefined ? {} : { wallTimes }),
    },
    restS: set > ex.sets ? 0 : ex.restS,
  };
}

/**
 * Done: the tally stops being the exercise's, keeping its climbs and the time the set being
 * climbed spent on the wall. A set left part way counts as done, so the next Start resumes at
 * the one after it.
 */
export const withExerciseDone = (draft: LogSessionDraft, now: Date): LogSessionDraft => {
  const { exercise: _done, ...rest } = draft;
  const wallTimes = wallTimesAt(draft, now);
  return wallTimes === undefined ? rest : { ...rest, wallTimes };
};

/** A tally climb as a set keeps it. */
export const setClimbOf = (c: ClimbDraft): SetClimb => ({
  grade: c.grade,
  scale: c.scale,
  tries: Math.max(1, c.tries),
  sent: c.kind === "send",
  ...(c.kind === "send" ? { style: c.style } : {}),
  ...(c.circuit === undefined ? {} : { circuit: c.circuit }),
  ...(c.name.trim() === "" ? {} : { name: c.name.trim() }),
});

/**
 * An item's climbs as the sets they went in, from the first to the last with a climb, each with
 * its time on the wall: a set still running counts to `now`, and only a set with no clock at all
 * takes the planned time.
 */
export function exerciseSets(
  draft: LogSessionDraft,
  item: number,
  plannedS: number | undefined,
  now: Date
): SetDone[] {
  const mine = climbsOfItem(draft.climbs, item);
  const last = Math.max(0, ...mine.map(setOf));
  const wallTimes = wallTimesAt(draft, now);
  return Array.from({ length: last }, (_, i) => {
    const onS = wallTimes?.find((w) => w.item === item && w.set === i + 1)?.onS ?? plannedS;
    return {
      ...(onS === undefined ? {} : { onS }),
      climbs: mine.filter((c) => setOf(c) === i + 1).map(setClimbOf),
    };
  });
}
