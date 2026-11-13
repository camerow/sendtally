import React from "react";
import {
  protocolOf,
  startIntervalsRun,
  startWorkoutRun,
  stepsDone,
  type HangPhase,
  type HangSetup,
  type IntervalPhase,
  type ItemDone,
  type Phase,
  type PlanLink,
  type Run,
} from "@sendtally/core/hang";
import { doneOfRun } from "../activities/intervals";
import type { LiveRunStore, PlayerPath } from "./liveRun";
import { intervalsParams, timerParams, type DoneParams, type IntervalsRun } from "./runParams";
import type { Sound } from "./timerCues";
import { hangRunDone } from "./timerView";
import { useHangTimer, type HangTimer } from "./useHangTimer";
import type { PlannedRun } from "./usePlannedRun";

/** Where a timer was when it was minimised or the page closed: its run, and the hang timer's setups. */
export type ResumedTimer = { run: Run; setups?: HangSetup[] };

export function resumedTimer(
  store: LiveRunStore,
  pathname: PlayerPath,
  workoutId: string | null
): ResumedTimer | null {
  const state = store.resumed(pathname, workoutId)?.state;
  return state?.player === "timer" ? state : null;
}

type PlayerInputs = {
  store: LiveRunStore;
  playSound: (s: Sound) => void;
  /** Ends the run as it opens, for its review. */
  end: boolean;
};

function useEndOnOpen<P extends Phase>(end: boolean, timer: HangTimer<P>): void {
  const ending = React.useRef(end);
  React.useEffect(() => {
    if (!ending.current) return;
    ending.current = false;
    timer.end();
  }, [timer]);
}

export type HangTimerInputs = PlayerInputs & {
  planned: PlannedRun;
  grips: readonly string[];
  setups: HangSetup[];
  link: PlanLink;
  session: number;
  resumed: ResumedTimer | null;
  /** The finished run's review. */
  onFinish: (review: DoneParams) => void;
};

/** A hangboard workout in the timer, kept in `store` so it outlasts the page, handed to its review once it finishes. */
export function useHangTimerPlayer({
  planned,
  grips,
  setups,
  link,
  session,
  resumed,
  store,
  playSound,
  end,
  onFinish,
}: HangTimerInputs): HangTimer<HangPhase> {
  const workout = planned.items[0].workout;
  const timer = useHangTimer(
    (now) =>
      (resumed?.run as Run<HangPhase> | undefined) ??
      startWorkoutRun(
        planned.items.map((i) => protocolOf(i.workout)),
        planned.exerciseRestS,
        now
      ),
    playSound
  );
  const { run } = timer;
  const gripId = grips[0] ?? workout.grip;

  React.useEffect(() => {
    store.write({
      title: workout.name,
      workoutId: workout.id,
      pathname: "/workout/timer",
      params: timerParams(workout.id, gripId, session, link),
      startedAt: run.startedAt,
      state: { player: "timer", run, setups },
    });
  }, [store, run, workout, gripId, session, link, setups]);

  useEndOnOpen(end, timer);

  const finish = React.useRef(onFinish);
  React.useEffect(() => {
    finish.current = onFinish;
  });
  const sent = React.useRef(false);
  React.useEffect(() => {
    if (run.finished === null || sent.current) return;
    sent.current = true;
    finish.current({
      workoutId: workout.id,
      gripId,
      link,
      session,
      run: hangRunDone(run, planned, grips, setups),
    });
  }, [run, planned, workout, gripId, grips, setups, link, session]);

  return timer;
}

export type IntervalsInputs = PlayerInputs & {
  workout: IntervalsRun;
  /** What the finished run did, for its review. */
  onFinish: (done: ItemDone[], off: string[], startedAt: number) => void;
};

/** An intervals workout in the timer, round by round, kept in `store`, handed to its review once it finishes. */
export function useIntervalsPlayer({
  workout,
  store,
  playSound,
  end,
  onFinish,
}: IntervalsInputs): HangTimer<IntervalPhase> {
  const timer = useHangTimer(
    (now) =>
      (resumedTimer(store, "/workout/intervals", workout.workoutId)?.run as
        Run<IntervalPhase> | undefined) ?? startIntervalsRun(workout.body, now),
    playSound
  );
  const { run } = timer;
  const climbing = workout.kind === "climbing";

  const finish = React.useRef(onFinish);
  React.useEffect(() => {
    finish.current = onFinish;
  });
  const sent = React.useRef(false);
  React.useEffect(() => {
    store.write({
      title: workout.title,
      workoutId: workout.workoutId,
      pathname: "/workout/intervals",
      params: intervalsParams(workout),
      startedAt: run.startedAt,
      state: { player: "timer", run, ...(climbing ? { laps: true } : {}) },
    });
    if (run.finished === null || sent.current) return;
    sent.current = true;
    const { done, off } = doneOfRun(workout.body, stepsDone(run));
    finish.current(done, off, run.startedAt);
  }, [store, run, workout, climbing]);

  useEndOnOpen(end, timer);

  return timer;
}
