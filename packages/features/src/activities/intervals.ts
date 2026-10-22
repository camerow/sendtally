import type { ActivityDetail, PlanTemplate } from "@sendtally/api-client";
import { clock, intervalSeconds, toUnit, type WeightUnit } from "@sendtally/core/hang";
import { humanDuration } from "../hang/format";
import { formatNumber, t, type MessageKey } from "../i18n";

export type IntervalsDetail = Extract<ActivityDetail, { kind: "intervals" }>;

export type IntervalsTemplate = Extract<PlanTemplate, { kind: "intervals" }>;

export type IntervalStep = IntervalsTemplate["steps"][number];

export type IntervalSide = NonNullable<IntervalStep["side"]>;

export type StepDone = IntervalsDetail["stepsDone"][number];

export const INTERVAL_SIDES = ["L", "R", "each"] as const satisfies readonly IntervalSide[];

const SIDE_TEXT = {
  L: "activities.sideLeft",
  R: "activities.sideRight",
  each: "activities.eachSide",
} as const satisfies Record<IntervalSide, MessageKey>;

const DEFAULT_SECONDS = 30;
const DEFAULT_COUNT = 10;
const DEFAULT_REST = 15;

export const newIntervalStep = (): IntervalStep => ({
  label: "",
  measure: "time",
  seconds: DEFAULT_SECONDS,
  restAfter: DEFAULT_REST,
});

export const emptyIntervals = (): IntervalsDetail => ({
  kind: "intervals",
  rounds: 1,
  steps: [newIntervalStep()],
  stepsDone: [],
});

/** Switches a step between held for a time and done for a count, keeping a sensible number. */
export function withMeasure(step: IntervalStep, measure: IntervalStep["measure"]): IntervalStep {
  const { seconds, count, ...rest } = step;
  return measure === "time"
    ? { ...rest, measure, seconds: seconds ?? DEFAULT_SECONDS }
    : { ...rest, measure, count: count ?? DEFAULT_COUNT };
}

const cleanStep = ({ seconds, count, cue, ...step }: IntervalStep): IntervalStep => {
  const trimmed = cue?.trim() ?? "";
  return {
    ...step,
    label: step.label.trim(),
    ...(step.measure === "time"
      ? { seconds: seconds ?? DEFAULT_SECONDS }
      : { count: count ?? DEFAULT_COUNT }),
    ...(trimmed === "" ? {} : { cue: trimmed }),
  };
};

/** Named steps only, trimmed, with what a run did kept where its step still exists. */
export function cleanIntervals(detail: IntervalsDetail): IntervalsDetail | null {
  const steps = detail.steps.filter((s) => s.label.trim() !== "").map(cleanStep);
  if (steps.length === 0) return null;
  const stepsDone = detail.stepsDone.filter(
    (d) => d.round < detail.rounds && d.step < steps.length
  );
  return { ...detail, steps, stepsDone };
}

/** "2 rounds · 7 steps · 18 min" */
export function intervalsSummary(body: IntervalsTemplate): string {
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
