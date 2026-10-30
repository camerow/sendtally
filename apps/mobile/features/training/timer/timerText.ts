import { clock, currentPhase, type Phase, type Run } from "@sendtally/core/hang";
import { t, type MessageKey } from "@sendtally/features/i18n";

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
  hint: string;
  setLine: string;
  next: string;
  fail: string;
};

const label = (run: Run, phase: Phase): MessageKey =>
  phase.kind === "ready" && run.index > 0 ? "hang.phaseRest" : PHASE_LABELS[phase.kind];

/** What the run is doing now, "Hang" or "Rest"; climbing works as "Climb". */
export function phaseLabel(run: Run, climbing = false): string {
  const phase = currentPhase(run);
  return climbing && phase.kind === "hang" ? t("hang.phaseClimb") : t(label(run, phase));
}

/**
 * Every word the timer shows for where the run is now. `sets` is the current item's;
 * a Get ready after the first item is the rest between exercises.
 */
export function timerText(
  run: Run,
  secondsLeft: number,
  loadText: string,
  sets = run.sets
): TimerText {
  const phase = currentPhase(run);
  const paused = run.pausedAt !== null;
  const next = run.phases[run.index + 1];
  const pull = phase.taps > 0;
  return {
    label: paused ? t("hang.paused") : t(label(run, phase)),
    big: pull ? `${run.taps}/${phase.taps}` : clock(secondsLeft),
    hint: pull ? t("hang.tapAfterLift") : paused ? t("hang.tapToResume") : t("hang.tapToPause"),
    setLine:
      phase.kind === "ready"
        ? t("hang.setsAhead", { count: sets })
        : t("hang.setOf", { set: phase.set, sets }),
    next: nextText(next, loadText),
    fail: pull
      ? t("hang.missedLift")
      : t("hang.cameOffEarly", { n: Math.max(0, phase.seconds - secondsLeft) }),
  };
}

function nextText(next: Phase | undefined, loadText: string): string {
  if (next === undefined) return t("hang.nextFinish");
  switch (next.kind) {
    case "hang":
      return t("hang.nextHang", { n: next.seconds, set: next.set });
    case "rest":
      return t("hang.nextRest", { n: next.seconds });
    case "setrest":
      return t("hang.nextSetRest", { time: clock(next.seconds) });
    case "pull":
      return next.taps > 0
        ? t("hang.nextLift", { reps: next.taps, load: loadText })
        : t("hang.nextTimedLift", { n: next.seconds, set: next.set });
    case "ready":
      return t("hang.nextExerciseRest", { time: clock(next.seconds) });
  }
}
