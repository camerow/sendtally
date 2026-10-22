import {
  clock,
  currentPhase,
  toUnit,
  type IntervalPhase,
  type Intervals,
  type Run,
  type WeightUnit,
} from "@sendtally/core/hang";
import { stepDose } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";

export type StepText = {
  kicker: string;
  title: string;
  big: string;
  of: string | null;
  note: string | null;
};

export type UpNextItem = { index: number; side: string; name: string; dose: string; rest: boolean };

const UP_NEXT = 4;

const sideText = (side: IntervalPhase["side"]): string =>
  side === undefined ? "" : side === "L" ? t("activities.leftSide") : t("activities.rightSide");

/** The words on the current step's card: what it is, its side, the countdown and the cue. */
export function stepText(
  run: Run<IntervalPhase>,
  body: Intervals,
  secondsLeft: number,
  unit: WeightUnit
): StepText {
  const phase = currentPhase(run);
  const paused = run.pausedAt !== null;
  const coming = phase.kind === "ready" ? phase : run.phases[run.index + 1];
  const step = body.steps[phase.step];
  if (step === undefined) return { kicker: "", title: "", big: "", of: null, note: null };
  const timer = {
    big: clock(secondsLeft, true),
    of: t("activities.ofTime", { time: clock(phase.seconds, true) }),
  };
  if (phase.kind === "ready" || phase.kind === "rest" || phase.kind === "setrest") {
    const next = body.steps[coming?.step ?? 0] ?? step;
    return {
      kicker: paused
        ? t("hang.paused")
        : phase.kind === "ready"
          ? t("hang.phaseReady")
          : t("hang.phaseRest"),
      title: next.label,
      ...timer,
      note: stepDose(next, unit),
    };
  }
  const work = phase.taps > 0 ? t("activities.doReps") : t("activities.hold");
  const kicker = [paused ? t("hang.paused") : work, sideText(phase.side)]
    .filter((p) => p !== "")
    .join(" · ");
  if (phase.taps > 0)
    return {
      kicker,
      title: step.label,
      big: `× ${formatNumber(step.count ?? 0)}`,
      of:
        step.loadKg === undefined
          ? null
          : t("hang.loadPlain", { value: formatNumber(toUnit(step.loadKg, unit)), unit }),
      note: step.cue ?? t("activities.tapWhenDone"),
    };
  return { kicker, title: step.label, ...timer, note: step.cue ?? null };
}

/** The next few phases after this one, each side and rest its own row. */
export function upNext(run: Run<IntervalPhase>, body: Intervals): UpNextItem[] {
  return run.phases.slice(run.index + 1, run.index + 1 + UP_NEXT).map((phase, i) => {
    const step = body.steps[phase.step];
    const rest = phase.kind === "rest" || phase.kind === "setrest";
    return {
      index: run.index + 1 + i,
      side:
        phase.side === undefined
          ? ""
          : t(phase.side === "L" ? "activities.sideLeft" : "activities.sideRight"),
      name: rest ? t("hang.phaseRest") : (step?.label ?? ""),
      dose: phase.taps > 0 ? `× ${formatNumber(step?.count ?? 0)}` : clock(phase.seconds, true),
      rest,
    };
  });
}

/** "18:05", the local time a run began. */
export function startTimeOf(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
