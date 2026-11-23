import type { SetDone } from "@sendtally/core/hang";
import type { Endurance, EnduranceUnit } from "./endurance";
import { newClimb, nextClimbKey } from "./transforms";
import type { ClimbDraft, ExerciseTally, LogSessionDraft } from "./types";

/** What one lap of a circuit asks for: a number of moves, or a time on the wall. */
export type LapPlan = { unit: EnduranceUnit; target: number };

/** The circuit an item's laps are logged on: one endurance climb holding every lap. */
export const lapsClimb = (climbs: readonly ClimbDraft[], item: number): ClimbDraft | undefined =>
  climbs.find((c) => c.item === item && c.endurance !== undefined);

/** How far each lap of the exercise got so far, oldest first. */
export function lapsDone(draft: LogSessionDraft): number[] {
  const ex = draft.exercise;
  return ex === undefined ? [] : (lapsClimb(draft.climbs, ex.item)?.endurance?.laps ?? []);
}

/** The laps the exercise asks for, or more once + Add lap went past them. */
export const lapsPlanned = (draft: LogSessionDraft): number =>
  Math.max(draft.exercise?.sets ?? 0, lapsDone(draft).length);

export const allLapsDone = (draft: LogSessionDraft): boolean =>
  lapsDone(draft).length >= lapsPlanned(draft);

/** A lap's end: how far it got joins the circuit, and a time lap's clock stops. */
export function withLapLogged(draft: LogSessionDraft, done: number): LogSessionDraft {
  const ex = draft.exercise;
  if (ex?.lap === undefined) return draft;
  const { setStartedAt: _ended, ...exercise } = ex;
  const existing = lapsClimb(draft.climbs, ex.item);
  const endurance: Endurance = {
    unit: ex.lap.unit,
    target: ex.lap.target,
    laps: [...(existing?.endurance?.laps ?? []), Math.min(ex.lap.target, Math.max(0, done))],
  };
  const climbs = existing
    ? draft.climbs.map((c) => (c === existing ? { ...c, endurance } : c))
    : [
        ...draft.climbs,
        {
          ...newClimb(nextClimbKey(draft.climbs), "v"),
          grade: "",
          name: ex.name,
          kind: "send" as const,
          style: "redpoint" as const,
          tries: 1,
          endurance,
          item: ex.item,
          set: 1,
        },
      ];
  return { ...draft, climbs, exercise };
}

/** The exercise's circuit asking for `sets` laps, remembered for its item. */
function withLaps(draft: LogSessionDraft, sets: number): LogSessionDraft {
  const ex = draft.exercise;
  if (ex === undefined) return draft;
  const setsPlanned = { ...draft.setsPlanned, [ex.item]: sets };
  return { ...draft, setsPlanned, exercise: { ...ex, sets } };
}

/** Undo of a lap's −: the item asks for one lap more, whether or not the tally is still on it. */
export function withLapBack(draft: LogSessionDraft, item: number): LogSessionDraft {
  if (draft.exercise?.item === item) return withLaps(draft, lapsPlanned(draft) + 1);
  const laps = draft.setsPlanned?.[item];
  return laps === undefined
    ? draft
    : { ...draft, setsPlanned: { ...draft.setsPlanned, [item]: laps + 1 } };
}

/** A lap's −: a lap that holds nothing yet goes, down to one. */
export const lapRemovable = (draft: LogSessionDraft): boolean =>
  draft.exercise !== undefined &&
  lapsPlanned(draft) > 1 &&
  lapsDone(draft).length < lapsPlanned(draft);

export const withLapRemoved = (draft: LogSessionDraft): LogSessionDraft =>
  lapRemovable(draft) ? withLaps(draft, lapsPlanned(draft) - 1) : draft;

/** A logged lap of an item changed to how far it got. */
export function withLapChanged(
  draft: LogSessionDraft,
  item: number,
  lap: number,
  done: number
): LogSessionDraft {
  const circuit = lapsClimb(draft.climbs, item);
  const e = circuit?.endurance;
  if (circuit === undefined || e === undefined || e.laps[lap] === undefined) return draft;
  const laps = e.laps.map((v, i) => (i === lap ? Math.min(e.target, Math.max(0, done)) : v));
  return {
    ...draft,
    climbs: draft.climbs.map((c) => (c === circuit ? { ...c, endurance: { ...e, laps } } : c)),
  };
}

/** A logged lap's tick taken off: it is no longer logged, and the laps after it move up. */
export function withLapUnlogged(
  draft: LogSessionDraft,
  item: number,
  lap: number
): LogSessionDraft {
  const circuit = lapsClimb(draft.climbs, item);
  const e = circuit?.endurance;
  if (circuit === undefined || e === undefined) return draft;
  const laps = e.laps.filter((_, i) => i !== lap);
  return {
    ...draft,
    climbs: draft.climbs.map((c) => (c === circuit ? { ...c, endurance: { ...e, laps } } : c)),
  };
}

/** A time lap's clock starts. */
export function withLapStarted(draft: LogSessionDraft, now: Date): LogSessionDraft {
  const ex = draft.exercise;
  if (ex === undefined || ex.setStartedAt !== undefined) return draft;
  return { ...draft, exercise: { ...ex, setStartedAt: now.toISOString() } };
}

/** Seconds a time lap has been on the wall, none before it starts. */
export function lapElapsed(ex: ExerciseTally, now: Date): number | null {
  const started = Date.parse(ex.setStartedAt ?? "");
  if (Number.isNaN(started)) return null;
  return Math.max(0, Math.floor((now.getTime() - started) / 1000));
}

/** The rest taken after a lap, shown beside it. */
export function withLapRest(draft: LogSessionDraft, lap: number, seconds: number): LogSessionDraft {
  const ex = draft.exercise;
  if (ex === undefined) return draft;
  const rests = [...(ex.rests ?? [])];
  rests[lap] = seconds;
  return { ...draft, exercise: { ...ex, rests } };
}

/** An item's laps as the sets it keeps, each holding how far it got in moves or seconds. */
export function lapSets(climbs: readonly ClimbDraft[], item: number): SetDone[] {
  const e = lapsClimb(climbs, item)?.endurance;
  if (e === undefined) return [];
  return e.laps.map((done) => (e.unit === "moves" ? { reps: done } : { onS: done }));
}
