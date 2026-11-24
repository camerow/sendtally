import { clock, currentPhase, type Phase, type Run } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";

const PHASE_LABELS: Record<Phase["kind"], MessageKey> = {
  ready: "hang.phaseReady",
  hang: "hang.phaseHang",
  rest: "hang.phaseRest",
  setrest: "hang.phaseSetRest",
  pull: "hang.phaseLift",
};

export type TimerText = {
  label: string;
  big: string;
  setLine: string;
};

const label = (run: Run, phase: Phase): MessageKey =>
  phase.kind === "ready" && run.index > 0 ? "hang.phaseRest" : PHASE_LABELS[phase.kind];

/** What the run is doing now, "Hang" or "Rest"; climbing works as "Climb". */
export function phaseLabel(run: Run): string {
  return t(label(run, currentPhase(run)));
}

/**
 * Every word the timer shows for where the run is now. `sets` is the current item's, after
 * `before` already done outside the timer, which its set numbers count on from;
 * a Get ready after the first item is the rest between exercises.
 */
export function timerText(run: Run, secondsLeft: number, sets = run.sets, before = 0): TimerText {
  const phase = currentPhase(run);
  const paused = run.pausedAt !== null;
  const pull = phase.taps > 0;
  return {
    label: paused ? t("hang.paused") : t(label(run, phase)),
    big: pull ? `${run.taps}/${phase.taps}` : clock(secondsLeft),
    setLine:
      phase.kind === "ready"
        ? t("hang.setsAhead", { count: sets })
        : t("hang.setOf", { set: phase.set + before, sets: sets + before }),
  };
}
