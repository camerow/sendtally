import { defaultPullKg } from "./loads";
import { clamp } from "./parse";
import { seriesFor } from "./trends";
import type { HangKind, HangRun, WeightUnit } from "./types";

export const DEFAULT_EDGE_MM = 20;
export const MIN_EDGE_MM = 4;
export const MAX_EDGE_MM = 60;

/** What one run of a workout hangs from and adds: chosen per use, never stored on the workout. */
export type HangSetup = { edgeMm: number; loadKg: number };

export type SetupLayer = { edgeMm?: number | null; loadKg?: number | null } | null | undefined;

export const defaultEdgeMm = (kind: HangKind): number => (kind === "hang" ? DEFAULT_EDGE_MM : 0);

export const defaultSetup = (kind: HangKind, unit: WeightUnit): HangSetup => ({
  edgeMm: defaultEdgeMm(kind),
  loadKg: kind === "pull" ? defaultPullKg(unit) : 0,
});

/** Each field from the first layer that sets it, else the kind's default in the user's unit. */
export function resolveSetup(
  kind: HangKind,
  layers: readonly SetupLayer[],
  unit: WeightUnit
): HangSetup {
  const fallback = defaultSetup(kind, unit);
  const pick = (field: keyof HangSetup): number =>
    layers.map((l) => l?.[field]).find((v): v is number => typeof v === "number") ??
    fallback[field];
  return { edgeMm: pick("edgeMm"), loadKg: pick("loadKg") };
}

export function lastSession<T extends HangRun>(
  sessions: readonly T[],
  workoutId: string,
  gripId: string
): T | undefined {
  return seriesFor(sessions, workoutId, gripId).at(-1);
}

export const clampEdge = (mm: number): number => clamp(Math.round(mm), MIN_EDGE_MM, MAX_EDGE_MM);
