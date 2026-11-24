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
import { phaseLook, type PhaseLook } from "./phaseLook";

export type IntervalsView = {
  look: PhaseLook;
  /** Done on a counted step, Pause or Resume otherwise. */
  primary: string;
  step: StepText;
  /** Round 2 of 3. */
  round: string;
  upNext: UpNextItem[];
};

/** Every word and colour the intervals player shows for where its run is now. */
export function intervalsView(
  run: Run<IntervalPhase>,
  body: Intervals,
  secondsLeft: number,
  unit: WeightUnit
): IntervalsView {
  const phase = currentPhase(run);
  const tapped = phase.taps > 0;
  const working = isWork(phase.kind);
  const paused = run.pausedAt !== null;
  return {
    look: phaseLook(working, phase.kind === "ready"),
    primary: tapped ? t("common.done") : paused ? t("hang.resume") : t("hang.pause"),
    step: stepText(run, body, secondsLeft, unit),
    round: t("activities.roundOf", { round: phase.set, rounds: body.rounds }),
    upNext: upNext(run, body),
  };
}
