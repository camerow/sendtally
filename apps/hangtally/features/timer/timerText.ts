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

/** Every word the timer shows for where the run is now. */
export function timerText(run: Run, secondsLeft: number, loadText: string): TimerText {
  const phase = currentPhase(run);
  const paused = run.pausedAt !== null;
  const { reps, sets } = run.protocol;
  const next = run.phases[run.index + 1];
  const pull = phase.kind === "pull";
  return {
    label: paused ? t("hang.paused") : t(PHASE_LABELS[phase.kind]),
    big: pull ? `${run.taps}/${reps}` : clock(secondsLeft),
    hint: pull ? t("hang.tapAfterLift") : paused ? t("hang.tapToResume") : t("hang.tapToPause"),
    setLine:
      phase.kind === "ready"
        ? t("hang.setsAhead", { count: sets })
        : t("hang.setOf", { set: phase.set, sets }),
    next: nextText(next, reps, loadText),
    fail: pull
      ? t("hang.missedLift")
      : t("hang.cameOffEarly", { n: Math.max(0, phase.seconds - secondsLeft) }),
  };
}

function nextText(next: Phase | undefined, reps: number, loadText: string): string {
  if (next === undefined) return t("hang.nextFinish");
  switch (next.kind) {
    case "hang":
      return t("hang.nextHang", { n: next.seconds, set: next.set });
    case "rest":
      return t("hang.nextRest", { n: next.seconds });
    case "setrest":
      return t("hang.nextSetRest", { time: clock(next.seconds) });
    case "pull":
      return t("hang.nextLift", { reps, load: loadText });
    case "ready":
      return "";
  }
}
