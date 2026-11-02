import { exerciseName } from "@sendtally/features/workouts";
import type { LiveRun } from "../../live-session/liveRun";
import { readWorkoutRun } from "../data/workoutRunParams";
import { restAfter } from "../rest/restCountdown";
import { afterKey, allSets, restAfterTick, setKey } from "../sets/setsRun";

/**
 * The live run with its hold recorded while no player is open: the set or line ticked with
 * what it held, and the rest that tick starts, from `now`.
 */
export function finishedRun(live: LiveRun, held: number, now: number): LiveRun {
  const { hold, rest: _, ...rest } = live;
  const run = readWorkoutRun(live.params);
  if (hold === undefined || run === null) return live;
  const { state } = live;
  const name = (i: number | null): string | null =>
    i === null ? null : exerciseName(run.items[i]?.exercise ?? "");
  const withRest = (next: LiveRun, at: string, seconds: number, before: number | null): LiveRun => {
    const r = restAfter(at, seconds, name(before), now);
    return r === null ? next : { ...next, rest: r };
  };
  if (state.player === "sets") {
    const at = allSets(run.items).find((x) => setKey(x) === hold.at);
    if (at === undefined) return rest;
    const ticked = new Set([...state.ticked, hold.at]);
    const done = state.done.map((d) =>
      d.item === at.item
        ? { ...d, sets: d.sets.map((s, i) => (i === at.set ? { ...s, onS: held } : s)) }
        : d
    );
    const next = { ...rest, state: { ...state, done, ticked: [...ticked] } };
    const after = restAfterTick(run.items, ticked, at, run.exerciseRestS);
    return after === null ? next : withRest(next, after.at, after.seconds, after.next);
  }
  if (state.player === "checklist") {
    const i = Number(hold.at);
    const ticked = [...new Set([...state.ticked, i])];
    const next = { ...rest, state: { ...state, ticked } };
    const following = run.items.findIndex((_, j) => j > i && !ticked.includes(j));
    return following === -1 ? next : withRest(next, afterKey(i), run.exerciseRestS, following);
  }
  return rest;
}
