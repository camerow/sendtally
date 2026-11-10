import type { SetDone } from "@sendtally/core/hang";
import { t } from "../i18n";
import { enduranceAmountLabel, type Endurance, type EnduranceUnit } from "./endurance";
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

/** + Add lap: one more than the exercise asks for. */
export function withLapAdded(draft: LogSessionDraft): LogSessionDraft {
  const ex = draft.exercise;
  return ex === undefined ? draft : { ...draft, exercise: { ...ex, sets: lapsPlanned(draft) + 1 } };
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

/** "Lap 3 of 3", or "All laps done". */
export const lapClockLabel = (draft: LogSessionDraft): string =>
  allLapsDone(draft)
    ? t("tally.allLapsDone")
    : t("tally.lapOf", { set: lapsDone(draft).length + 1, sets: lapsPlanned(draft) });

/** "Circuit laps · 40 moves" */
export function lapLine(draft: LogSessionDraft): string {
  const ex = draft.exercise;
  if (ex?.lap === undefined) return "";
  return `${ex.name} · ${enduranceAmountLabel({ ...ex.lap, laps: [] }, ex.lap.target)}`;
}

/** An item's laps as the sets it keeps, each holding how far it got in moves or seconds. */
export function lapSets(climbs: readonly ClimbDraft[], item: number): SetDone[] {
  const e = lapsClimb(climbs, item)?.endurance;
  if (e === undefined) return [];
  return e.laps.map((done) => (e.unit === "moves" ? { reps: done } : { onS: done }));
}
