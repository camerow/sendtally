import {
  currentPhase,
  isWork,
  type IntervalPhase,
  type Intervals,
  type Run,
  type WeightUnit,
} from "@sendtally/core/hang";
import { stepText, upNext, type StepText, type UpNextItem } from "../activities/intervalsText";
import { t } from "../i18n";
import { elapsedClock } from "../sessions/years";
import { phaseLook, type PhaseLook } from "./phaseLook";

export type IntervalsView = {
  look: PhaseLook;
  /** Done on a counted step, Pause or Resume otherwise. */
  primary: string;
  /** Stopped early, or Stop here on a climb, while a timed step runs. */
  fail: string | null;
  step: StepText;
  /** Round 2 of 3, or Lap 2 of 3 on a climb. */
  round: string;
  upNext: UpNextItem[];
};

/** Every word and colour the intervals player shows for where its run is now. */
export function intervalsView(
  run: Run<IntervalPhase>,
  body: Intervals,
  secondsLeft: number,
  unit: WeightUnit,
  climbing: boolean
): IntervalsView {
  const phase = currentPhase(run);
  const tapped = phase.taps > 0;
  const working = isWork(phase.kind);
  const paused = run.pausedAt !== null;
  const held = Math.max(0, phase.seconds - secondsLeft);
  const sets = { set: phase.set, sets: body.rounds };
  return {
    look: phaseLook(working, phase.kind === "ready"),
    primary: tapped ? t("common.done") : paused ? t("hang.resume") : t("hang.pause"),
    fail:
      working && !tapped && !paused
        ? climbing
          ? t("activities.stopHere", { time: elapsedClock(held) })
          : t("activities.stoppedEarly", { n: held })
        : null,
    step: stepText(run, body, secondsLeft, unit, climbing),
    round: climbing
      ? t("tally.lapOf", sets)
      : t("activities.roundOf", { round: phase.set, rounds: body.rounds }),
    upNext: upNext(run, body),
  };
}
