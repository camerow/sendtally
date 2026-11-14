import React from "react";
import { doneAsPrescribed, type ItemDone } from "@sendtally/core/hang";
import type { Hold } from "./holdClock";
import { exerciseName } from "./library";
import type { LiveRunStore } from "./liveRun";
import { runParams, type WorkoutRun } from "./runParams";
import { afterKey, allSets, setKey } from "./setsRun";
import { useHold, useRest, type HoldClock, type RestClock } from "./useLiveRun";

export type ChecklistPlayer = {
  startedAt: number;
  ticked: ReadonlySet<number>;
  rest: RestClock;
  hold: HoldClock;
  toggle: (i: number) => void;
  /** The seconds a line's hold would run for, when it is timed, unticked, and nothing holds yet. */
  holdTarget: (i: number) => number | null;
  startHold: (i: number) => void;
  /** Ends a line's hold; a timed line ticks itself once it is done, Done in the count-in only cancels. */
  endHold: (h: Hold, seconds: number | null) => void;
  /** What the run did and the lines it left unticked, for its review. */
  finished: () => { done: ItemDone[]; off: string[] };
};

/**
 * A workout of plain lines: tick each as it is done, with the workout's rest between them and
 * timed lines held in their row. Kept in `store` so the run outlasts the page.
 */
export function useChecklistPlayer(
  run: WorkoutRun,
  store: LiveRunStore,
  /** Whether an exercise is done each side, which its hold counts twice. */
  sided: (exercise: string) => boolean
): ChecklistPlayer {
  const [resumed] = React.useState(() => {
    const live = store.resumed("/workout/checklist", run.workoutId);
    return live?.state.player === "checklist" ? { ...live.state, startedAt: live.startedAt } : null;
  });
  const [startedAt] = React.useState(() => resumed?.startedAt ?? Date.now());
  const [ticked, setTicked] = React.useState<ReadonlySet<number>>(() => new Set(resumed?.ticked));
  React.useEffect(() => {
    store.write({
      title: run.title,
      workoutId: run.workoutId,
      pathname: "/workout/checklist",
      params: runParams(run),
      startedAt,
      state: { player: "checklist", ticked: [...ticked], count: run.items.length },
    });
  }, [store, run, startedAt, ticked]);
  const rest = useRest(store);
  const toggle = (i: number): void => {
    const next = new Set(ticked);
    const ticking = !next.delete(i);
    if (ticking) next.add(i);
    setTicked(next);
    const following = run.items.findIndex((_, j) => j > i && !next.has(j));
    const name = run.items[following]?.exercise;
    if (!ticking || name === undefined) rest.skip();
    else rest.tick(afterKey(i), run.exerciseRestS, exerciseName(name));
  };
  const endHold = (h: Hold, seconds: number | null): void => {
    store.writeHold(null);
    const i = Number(h.at);
    if (seconds !== null && !ticked.has(i)) toggle(i);
  };
  const hold = useHold(store, (h) => endHold(h, h.targetS));
  const holdTarget = (i: number): number | null => {
    const dose = run.items[i]?.dose;
    return !ticked.has(i) &&
      hold.hold === null &&
      dose?.reps === undefined &&
      dose?.onS !== undefined &&
      dose.onS > 0
      ? dose.onS
      : null;
  };
  return {
    startedAt,
    ticked,
    rest,
    hold,
    toggle,
    holdTarget,
    startHold: (i) => {
      const targetS = holdTarget(i);
      const exercise = run.items[i]?.exercise ?? "";
      if (targetS !== null) hold.start(String(i), exerciseName(exercise), targetS, sided(exercise));
    },
    endHold,
    finished: () => {
      rest.skip();
      hold.stop();
      return {
        done: doneAsPrescribed(run.items),
        off: allSets(run.items)
          .filter((at) => !ticked.has(at.item))
          .map(setKey),
      };
    },
  };
}
