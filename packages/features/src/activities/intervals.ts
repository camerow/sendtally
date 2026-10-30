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
import { setKeyOf } from "./done";
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

/**
 * What a run did, per step: one set per turn, round by round and side by side, holding the
 * seconds held when cut short. A turn the run never finished stays at its planned dose, off.
 */
export function doneOfRun(
  body: Intervals,
  stepsDone: readonly StepDone[]
): { done: ItemDone[]; off: string[] } {
  const off: string[] = [];
  const done = body.steps.map((step, item) => {
    const planned = {
      ...(step.seconds === undefined ? {} : { onS: step.seconds }),
      ...(step.count === undefined ? {} : { reps: step.count }),
      ...(step.loadKg === undefined ? {} : { weightKg: step.loadKg }),
    };
    const sides = step.side === "each" ? (["L", "R"] as const) : [step.side];
    const turns = Array.from({ length: body.rounds }, (_, round) =>
      sides.map((side) => ({ round, side }))
    ).flat();
    const sets = turns.map(({ round, side }, set) => {
      const ran = stepsDone.find((d) => d.step === item && d.round === round && d.side === side);
      if (ran === undefined) off.push(setKeyOf(item, set));
      return ran?.heldSeconds === undefined ? planned : { ...planned, onS: ran.heldSeconds };
    });
    return { item, exercise: step.label, sets };
  });
  return { done, off };
}
