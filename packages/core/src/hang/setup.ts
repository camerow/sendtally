import { DEFAULT_PULL_KG } from "./loads";
import { clamp } from "./parse";
import { seriesFor } from "./trends";
import type { HangKind, HangSession } from "./types";

export const DEFAULT_EDGE_MM = 20;
export const MIN_EDGE_MM = 4;
export const MAX_EDGE_MM = 60;

/** What one run of a workout hangs from and adds: chosen per use, never stored on the workout. */
export type HangSetup = { edgeMm: number; loadKg: number };

export type SetupLayer = { edgeMm?: number | null; loadKg?: number | null } | null | undefined;

export const defaultSetup = (kind: HangKind): HangSetup => ({
  edgeMm: kind === "hang" ? DEFAULT_EDGE_MM : 0,
  loadKg: kind === "pull" ? DEFAULT_PULL_KG : 0,
});

/** Each field from the first layer that sets it, else the kind's default. */
export function resolveSetup(kind: HangKind, layers: readonly SetupLayer[]): HangSetup {
  const fallback = defaultSetup(kind);
  const pick = (field: keyof HangSetup): number =>
    layers.map((l) => l?.[field]).find((v): v is number => typeof v === "number") ??
    fallback[field];
  return { edgeMm: pick("edgeMm"), loadKg: pick("loadKg") };
}

export function lastSession<T extends HangSession>(
  sessions: readonly T[],
  workoutId: string,
  gripId: string
): T | undefined {
  return seriesFor(sessions, workoutId, gripId).at(-1);
}

export const clampEdge = (mm: number): number => clamp(Math.round(mm), MIN_EDGE_MM, MAX_EDGE_MM);
