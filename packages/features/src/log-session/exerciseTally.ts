import type { SetClimb, SetDone } from "@sendtally/core/hang";
import { t } from "../i18n";
import { tallyDraft } from "./tally";
import type { ClimbDraft, ExerciseTally, LogSessionDraft } from "./types";

/** What an exercise's tally is started from: everything but where it has got to. */
export type ExerciseTallyStart = Omit<ExerciseTally, "set" | "setStartedAt">;

/** A set to show on the tally: its climbs newest first, under a header. */
export type TallySetGroup = { set: number; label: string; climbs: ClimbDraft[] };

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
  const base = draft ?? tallyDraft(now);
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
  return Math.max(0, ex.onS - Math.floor((now.getTime() - started) / 1000));
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

/** Whether the set being climbed is over: its last climb logged, or its time on the wall up. */
export function setOver(draft: LogSessionDraft, now: Date): boolean {
  const ex = draft.exercise;
  if (ex === undefined || allSetsDone(ex)) return false;
  if (ex.climbs !== undefined) return setClimbs(draft, ex).length >= ex.climbs;
  return ex.setStartedAt !== undefined && wallLeft(ex, now) === 0;
}

/** The set after, and the rest before it: none after the last. */
export function withSetEnded(draft: LogSessionDraft): { draft: LogSessionDraft; restS: number } {
  const ex = draft.exercise;
  if (ex === undefined) return { draft, restS: 0 };
  const { setStartedAt: _ended, ...rest } = ex;
  const set = ex.set + 1;
  return { draft: { ...draft, exercise: { ...rest, set } }, restS: set > ex.sets ? 0 : ex.restS };
}

/**
 * Done: the tally stops being the exercise's, keeping its climbs. A set left part way counts
 * as done, so the next Start resumes at the one after it.
 */
export const withExerciseDone = (draft: LogSessionDraft): LogSessionDraft => {
  const { exercise: _done, ...rest } = draft;
  return rest;
};

/** "4x4s · Set 2 of 4 · 2 of 4 climbs", "ARC · Set 1 of 2 · 9 laps", or the set next while resting. */
export function exerciseLine(draft: LogSessionDraft, resting: boolean): string {
  const ex = draft.exercise;
  if (ex === undefined) return "";
  if (allSetsDone(ex)) return `${ex.name} · ${t("tally.allSetsDone")}`;
  const set = { set: ex.set, sets: ex.sets };
  if (resting) return `${ex.name} · ${t("tally.setNext", set)}`;
  const n = setClimbs(draft, ex).length;
  const count =
    ex.onS !== undefined
      ? t("tally.lapCount", { count: n })
      : ex.climbs !== undefined
        ? t("tally.climbsOfSet", { n, of: ex.climbs })
        : t("common.climbCount", { count: n });
  return [ex.name, t("tally.setOf", set), count].join(" · ");
}

/** The exercise's climbs by set, the set being climbed first and each newest first. */
export function setGroups(draft: LogSessionDraft): TallySetGroup[] {
  const ex = draft.exercise;
  if (ex === undefined) return [];
  const mine = climbsOfItem(draft.climbs, ex.item);
  const last = Math.max(climbingSet(ex), ...mine.map(setOf));
  return Array.from({ length: last }, (_, i) => last - i).flatMap((set) => {
    const climbs = mine.filter((c) => setOf(c) === set).reverse();
    const current = set === climbingSet(ex) && !allSetsDone(ex);
    if (climbs.length === 0 && !current) return [];
    const full = !current && ex.climbs !== undefined;
    return [
      {
        set,
        climbs,
        label: full
          ? `${t("tally.setLabel", { set })} · ${t("tally.climbsOfSet", { n: climbs.length, of: ex.climbs ?? 0 })}`
          : t("tally.setLabel", { set }),
      },
    ];
  });
}

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

/** An item's climbs as the sets they went in, from the first to the last with a climb, each with its time on the wall. */
export function exerciseSets(climbs: readonly ClimbDraft[], item: number, onS?: number): SetDone[] {
  const mine = climbsOfItem(climbs, item);
  const last = Math.max(0, ...mine.map(setOf));
  return Array.from({ length: last }, (_, i) => ({
    ...(onS === undefined ? {} : { onS }),
    climbs: mine.filter((c) => setOf(c) === i + 1).map(setClimbOf),
  }));
}
