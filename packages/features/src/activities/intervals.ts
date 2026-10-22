import {
  clock,
  intervalSeconds,
  toUnit,
  type Intervals,
  type IntervalSide,
  type IntervalStep,
  type ItemDone,
  type StepDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { humanDuration } from "../hang/format";
import { formatNumber, t, type MessageKey } from "../i18n";

const SIDE_TEXT = {
  L: "activities.sideLeft",
  R: "activities.sideRight",
  each: "activities.eachSide",
} as const satisfies Record<IntervalSide, MessageKey>;

/** "2 rounds · 7 steps · 18 min" */
export function intervalsSummary(body: Intervals): string {
  return [
    t("activities.roundCount", { count: body.rounds }),
    t("activities.stepCount", { count: body.steps.length }),
    humanDuration(intervalSeconds(body)),
  ].join(" · ");
}

/** What one step asks for: "0:45 · each side", "× 15 · 24 kg". */
export function stepDose(step: IntervalStep, unit: WeightUnit): string {
  const work =
    step.measure === "time" ? clock(step.seconds ?? 0, true) : `× ${formatNumber(step.count ?? 0)}`;
  const load =
    step.loadKg === undefined
      ? ""
      : t("hang.loadPlain", { value: formatNumber(toUnit(step.loadKg, unit)), unit });
  const side = step.side === undefined ? "" : t(SIDE_TEXT[step.side]);
  return [work, load, side].filter((p) => p !== "").join(" · ");
}

/** What a run did, per step: one set per turn, holding the seconds held when cut short. */
export function doneOfRun(body: Intervals, stepsDone: readonly StepDone[]): ItemDone[] {
  return body.steps.map((step, item) => ({
    item,
    exercise: step.label,
    sets: stepsDone
      .filter((d) => d.step === item)
      .map((d) => {
        const onS = d.heldSeconds ?? step.seconds;
        return {
          ...(onS === undefined ? {} : { onS }),
          ...(step.count === undefined ? {} : { reps: step.count }),
          ...(step.loadKg === undefined ? {} : { weightKg: step.loadKg }),
        };
      }),
  }));
}
