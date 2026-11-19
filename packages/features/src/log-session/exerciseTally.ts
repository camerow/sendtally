import type { SetClimb, SetDone } from "@sendtally/core/hang";
import { newTallyClimb, tallyDraft, type TallyChoice } from "./tally";
import { withTries } from "./transforms";
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

const wallRunS = (ex: ExerciseTally, now: Date): number => {
  const started = Date.parse(ex.setStartedAt ?? "");
  return Number.isNaN(started) ? 0 : Math.floor((now.getTime() - started) / 1000);
};

/** The set's clock has run, now or before a pause. */
const wallRan = (ex: ExerciseTally): boolean =>
  ex.setStartedAt !== undefined || ex.setOnS !== undefined;

/** Seconds left on the wall in the set, the whole time before its clock starts; null without a time. */
export function wallLeft(ex: ExerciseTally, now: Date): number | null {
  if (ex.onS === undefined) return null;
  const spent = (ex.setOnS ?? 0) + wallRunS(ex, now);
  return Math.min(ex.onS, Math.max(0, ex.onS - spent));
}

/** The set's clock started, or paused with its time so far kept. */
export function withWallToggled(draft: LogSessionDraft, now: Date): LogSessionDraft {
  const ex = draft.exercise;
  if (ex?.onS === undefined || allSetsDone(ex)) return draft;
  if (ex.setStartedAt === undefined)
    return { ...draft, exercise: { ...ex, setStartedAt: now.toISOString() } };
  const { setStartedAt: _paused, ...rest } = ex;
  const spent = ex.onS - (wallLeft(ex, now) ?? 0);
  return { ...draft, exercise: { ...rest, setOnS: spent } };
}

/** A grade picked in a time set that has not started starts its clock. */
export function withWallStarted(draft: LogSessionDraft, now: Date): LogSessionDraft {
  const ex = draft.exercise;
  if (ex?.onS === undefined || ex.setStartedAt !== undefined || allSetsDone(ex)) return draft;
  return { ...draft, exercise: { ...ex, setStartedAt: now.toISOString() } };
}

/** A grade picked adds a climb at it to the set being climbed, one attempt and not sent yet. */
export function withSetClimbAdded(draft: LogSessionDraft, choice: TallyChoice): LogSessionDraft {
  const next = newTallyClimb(draft, choice, "fell");
  return withExerciseClimb(next.draft, next.key);
}

/** A climb's attempts, at least one, its send style following them. */
export function withClimbTries(
  draft: LogSessionDraft,
  key: string,
  tries: number
): LogSessionDraft {
  return { ...draft, climbs: draft.climbs.map((c) => (c.key === key ? withTries(c, tries) : c)) };
}

export const withoutClimb = (draft: LogSessionDraft, key: string): LogSessionDraft => ({
  ...draft,
  climbs: draft.climbs.filter((c) => c.key !== key),
});

/** A climb just logged joins the exercise's item and the set being climbed. */
export function withExerciseClimb(draft: LogSessionDraft, key: string): LogSessionDraft {
  const ex = draft.exercise;
  if (ex === undefined) return draft;
  const tag = { item: ex.item, set: climbingSet(ex) };
  return { ...draft, climbs: draft.climbs.map((c) => (c.key === key ? { ...c, ...tag } : c)) };
}

/** A send becomes an attempt and an attempt a send, styled by its tries: flash at one, redpoint above. */
export function withClimbFlipped(draft: LogSessionDraft, key: string): LogSessionDraft {
  if (!draft.climbs.some((c) => c.key === key)) return draft;
  const flip = (c: ClimbDraft): ClimbDraft =>
    c.key === key ? withTries({ ...c, kind: c.kind === "send" ? "attempt" : "send" }, c.tries) : c;
  return { ...draft, climbs: draft.climbs.map(flip) };
}

/** Whether the set being climbed has had its time on the wall. */
export function timeUp(draft: LogSessionDraft, now: Date): boolean {
  const ex = draft.exercise;
  if (ex === undefined || allSetsDone(ex) || ex.climbs !== undefined) return false;
  return wallRan(ex) && wallLeft(ex, now) === 0;
}

/** Whether the set being climbed is over: its last climb logged, or its time on the wall up. */
export function setOver(draft: LogSessionDraft, now: Date): boolean {
  const ex = draft.exercise;
  if (ex === undefined || allSetsDone(ex)) return false;
  if (ex.climbs !== undefined) return setClimbs(draft, ex).length >= ex.climbs;
  return timeUp(draft, now);
}

/** Only a set whose clock started gets a time on the wall. */
function wallTimesAt(draft: LogSessionDraft, now: Date): WallTime[] | undefined {
  const ex = draft.exercise;
  const left = ex === undefined ? null : wallLeft(ex, now);
  if (ex?.onS === undefined || !wallRan(ex) || left === null) return draft.wallTimes;
  return [...(draft.wallTimes ?? []), { item: ex.item, set: ex.set, onS: ex.onS - left }];
}

/** The set after, and the rest before it: none after the last. */
export function withSetEnded(
  draft: LogSessionDraft,
  now: Date
): { draft: LogSessionDraft; restS: number } {
  const ex = draft.exercise;
  if (ex === undefined) return { draft, restS: 0 };
  const { setStartedAt: _ended, setOnS: _spent, ...rest } = ex;
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
