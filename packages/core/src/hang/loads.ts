import type { HangKind, Loads, Workout, WeightUnit } from "./types";

export const LB_PER_KG = 2.20462;

export const DEFAULT_PULL_KG = 20;

export const loadKey = (workoutId: string, gripId: string): string => `${workoutId}:${gripId}`;

export function loadOf(
  loads: Loads,
  workout: Pick<Workout, "id" | "kind">,
  gripId: string
): number {
  return loads[loadKey(workout.id, gripId)] ?? (workout.kind === "pull" ? DEFAULT_PULL_KG : 0);
}

export function hasLoad(loads: Loads, workoutId: string, gripId: string): boolean {
  return loadKey(workoutId, gripId) in loads;
}

/** A kg value in the display unit, rounded to the nearest 0.5. */
export function toUnit(kg: number, unit: WeightUnit): number {
  return Math.round((unit === "lb" ? kg * LB_PER_KG : kg) * 2) / 2;
}

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

/** One − or + press: the step applies to the displayed value, then converts back. */
export function bumpLoad(kind: HangKind, kg: number, unit: WeightUnit, direction: 1 | -1): number {
  return clampLoad(kind, fromUnit(toUnit(kg, unit) + direction * loadStep(kind, unit), unit));
}
