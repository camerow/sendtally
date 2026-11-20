import type { HangKind, Loads, WeightUnit } from "./types";

export const LB_PER_KG = 2.20462;

export const WEIGHT_UNITS = ["lb", "kg"] as const satisfies readonly WeightUnit[];

/** The unit a new account reads weights in. */
export const DEFAULT_WEIGHT_UNIT: WeightUnit = "lb";

/** A ground pull's first load, authored per unit so it reads round in either. */
const DEFAULT_PULL: Record<WeightUnit, number> = { kg: 20, lb: 45 };

export const defaultPullKg = (unit: WeightUnit): number => fromUnit(DEFAULT_PULL[unit], unit);

export const loadKey = (workoutId: string, gripId: string): string => `${workoutId}:${gripId}`;

export function hasLoad(loads: Loads, workoutId: string, gripId: string): boolean {
  return loadKey(workoutId, gripId) in loads;
}

/** A kg value in the display unit, to the hundredth, so a value typed in either unit reads back as typed. */
export function toUnit(kg: number, unit: WeightUnit): number {
  return Math.round((unit === "lb" ? kg * LB_PER_KG : kg) * 100) / 100;
}

/** One step from `value` that lands on the step grid: 44.09 steps up to 45 and down to 40 on a 5 step. */
export function stepOnGrid(value: number, step: number, direction: 1 | -1): number {
  const at = value / step;
  const near = Math.round(at);
  const from = Math.abs(at - near) < 1e-6 ? near : direction === 1 ? Math.floor(at) : Math.ceil(at);
  return Math.round((from + direction) * step * 100) / 100;
}

/** The timer's load nudge mid-run: 1 lb or 0.5 kg. */
export const timerLoadStep = (unit: WeightUnit): number => (unit === "lb" ? 1 : 0.5);

/** Headroom a load chart leaves above and below its line, in the display unit. */
export const chartAir = (unit: WeightUnit): number => (unit === "lb" ? 4 : 2);

export function fromUnit(value: number, unit: WeightUnit): number {
  return unit === "lb" ? value / LB_PER_KG : value;
}

export function loadStep(kind: HangKind, unit: WeightUnit): number {
  if (kind === "pull") return unit === "lb" ? 5 : 2.5;
  return unit === "lb" ? 2 : 1;
}

export function clampLoad(kind: HangKind, kg: number): number {
  return kind === "pull" ? Math.max(0, kg) : kg;
}

/** One − or + press onto the step grid of the displayed value, then back to kg; the kind's step unless given one. */
export function bumpLoad(
  kind: HangKind,
  kg: number,
  unit: WeightUnit,
  direction: 1 | -1,
  step = loadStep(kind, unit)
): number {
  return clampLoad(kind, fromUnit(stepOnGrid(toUnit(kg, unit), step, direction), unit));
}
