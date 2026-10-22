import { addDays, daysBetween } from "./calendar";
import type { BlockPhase, CalendarDate, TrainingBlock } from "./types";

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
  b: Dated & Pick<TrainingBlock, "phases">,
  d: CalendarDate
): BlockPhase | null {
  const week = blockWeekOn(b, d);
  return week === null ? null : (b.phases[week - 1] ?? "build");
}

/** Build weeks, with the last a deload once a block runs four weeks or more. */
export function defaultPhases(weeks: number): BlockPhase[] {
  return Array.from({ length: weeks }, (_, i) =>
    weeks >= 4 && i === weeks - 1 ? "deload" : "build"
  );
}

/** Phases kept week by week when the length changes; new weeks build. */
export function resizePhases(phases: readonly BlockPhase[], weeks: number): BlockPhase[] {
  return Array.from({ length: weeks }, (_, i) => phases[i] ?? "build");
}

export function nextPhase(phase: BlockPhase): BlockPhase {
  return BLOCK_PHASES[(BLOCK_PHASES.indexOf(phase) + 1) % BLOCK_PHASES.length] ?? "build";
}
