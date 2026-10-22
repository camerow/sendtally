import { addDays, daysBetween } from "./calendar";
import { clamp } from "./parse";
import type { BlockPhase, CalendarDate, TrainingBlock, WeekLoad } from "./types";

export const BLOCK_PHASES = ["build", "deload", "test"] as const satisfies readonly BlockPhase[];

type Dated = Pick<TrainingBlock, "start" | "weeks" | "endedOn">;

/** Exclusive: when the last week runs out, or when the block was ended. */
export function blockEnd(b: Dated): CalendarDate {
  const planned = addDays(b.start, b.weeks * 7);
  return b.endedOn !== null && b.endedOn < planned ? b.endedOn : planned;
}

/** 1-based week of the block a date falls in, or null outside it. */
export function blockWeekOn(b: Dated, d: CalendarDate): number | null {
  if (d < b.start || d >= blockEnd(b)) return null;
  return Math.floor(daysBetween(b.start, d) / 7) + 1;
}

export function phaseOn(
  b: Dated & Pick<TrainingBlock, "loads">,
  d: CalendarDate
): BlockPhase | null {
  return weekOn(b, d)?.phase ?? null;
}

/** The load of the week a date falls in, or null outside the block. */
export function weekLoadOn(
  b: Dated & Pick<TrainingBlock, "loads">,
  d: CalendarDate
): number | null {
  return weekOn(b, d)?.load ?? null;
}

function weekOn(b: Dated & Pick<TrainingBlock, "loads">, d: CalendarDate): WeekLoad | null {
  const week = blockWeekOn(b, d);
  return week === null ? null : (b.loads[week - 1] ?? { load: BASE_WEEK_LOAD });
}

export const BASE_WEEK_LOAD = 100;
export const MIN_WEEK_LOAD = 50;
export const MAX_WEEK_LOAD = 150;
export const WEEK_LOAD_STEP = 5;

/** A load on the step grid, within range. */
export function clampWeekLoad(load: number): number {
  return clamp(Math.round(load / WEEK_LOAD_STEP) * WEEK_LOAD_STEP, MIN_WEEK_LOAD, MAX_WEEK_LOAD);
}

/** Every week at the base load, with no phase: the user shapes the block. */
export function evenWeekLoads(weeks: number): WeekLoad[] {
  return Array.from({ length: weeks }, () => ({ load: BASE_WEEK_LOAD }));
}

/** Weeks kept as they are when the length changes; new weeks carry on at the last week's load. */
export function resizeWeekLoads(loads: readonly WeekLoad[], weeks: number): WeekLoad[] {
  const last = loads.at(-1)?.load ?? BASE_WEEK_LOAD;
  return Array.from({ length: weeks }, (_, i) => loads[i] ?? { load: last });
}

export function stepWeekLoad(load: number, direction: 1 | -1): number {
  return clampWeekLoad(load + direction * WEEK_LOAD_STEP);
}

export const LOAD_SHAPES = ["flat", "ramp", "taper", "wave"] as const;

export type LoadShape = (typeof LOAD_SHAPES)[number];

const WAVE = [90, 105, 120, 105];

const ramp = (weeks: number): number[] =>
  Array.from({ length: weeks }, (_, i) =>
    weeks === 1 ? BASE_WEEK_LOAD : clampWeekLoad(90 + (30 * i) / (weeks - 1))
  );

function shapeLoads(shape: LoadShape, weeks: number): number[] {
  switch (shape) {
    case "flat":
      return Array.from({ length: weeks }, () => BASE_WEEK_LOAD);
    case "ramp":
      return ramp(weeks);
    case "taper":
      return weeks < 2 ? [BASE_WEEK_LOAD] : [...ramp(weeks - 1), 60];
    case "wave":
      return Array.from({ length: weeks }, (_, i) => WAVE[i % WAVE.length] ?? BASE_WEEK_LOAD);
  }
}

/** The loads of a preset shape, each week keeping its phase. */
export function withShape(loads: readonly WeekLoad[], shape: LoadShape): WeekLoad[] {
  const values = shapeLoads(shape, loads.length);
  return loads.map((w, i) => ({ ...w, load: values[i] ?? BASE_WEEK_LOAD }));
}

/** No phase, then each phase in turn, then none again. */
export function nextPhase(phase: BlockPhase | undefined): BlockPhase | undefined {
  return phase === undefined ? BLOCK_PHASES[0] : BLOCK_PHASES[BLOCK_PHASES.indexOf(phase) + 1];
}
