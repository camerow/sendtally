import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockEnd,
  totalSeconds,
  type Block,
  type CalendarDate,
  type Membership,
} from "@sendtally/core/hang";
import { trainingLoad } from "../activities/format";
import { isUnscored } from "../sessions/meta";
import { sessionMinutes } from "../sessions/years";
import { climbDate, type TrainingLog } from "./days";

/** One week of a block with the effort logged in it, as minutes times RPE. */
export type BlockWeek = {
  week: number;
  start: CalendarDate;
  actual: number;
  /** Not started yet, so nothing logged counts against it. */
  ahead: boolean;
};

export const blockMembers = (plan: Plan, block: Pick<Block, "id">): Membership[] =>
  plan.memberships.filter((m) => m.blockId === block.id);

const effort = (minutes: number | null, rpe: number | null | undefined): number =>
  minutes === null || rpe === null || rpe === undefined ? 0 : minutes * rpe;

function actualIn(dates: ReadonlySet<CalendarDate>, log: Omit<TrainingLog, "plan" | "workout">) {
  const activities = log.activities
    .filter((a) => dates.has(a.date))
    .reduce((sum, a) => sum + (trainingLoad(a) ?? 0), 0);
  const hangs = log.hangs
    .filter((h) => dates.has(h.date))
    .reduce((sum, h) => sum + effort(totalSeconds(h.protocol) / 60, h.rpe), 0);
  const climbs = log.climbs
    .filter((s) => dates.has(climbDate(s)) && !isUnscored(s))
    .reduce((sum, s) => sum + effort(sessionMinutes(s), s.rpe), 0);
  return activities + hangs + climbs;
}

/**
 * Each week of the block with everything logged in it, inside the block or not,
 * since a block plans the whole week.
 */
export function blockWeeks(
  block: Block,
  log: Omit<TrainingLog, "plan" | "workout">,
  today: CalendarDate
): BlockWeek[] {
  const end = blockEnd(block);
  return Array.from({ length: block.weeks }, (_, i): BlockWeek => {
    const start = addDays(block.start, i * 7);
    const dates = Array.from({ length: 7 }, (_, d) => addDays(start, d)).filter((d) => d < end);
    return {
      week: i + 1,
      start,
      actual: Math.round(actualIn(new Set(dates), log)),
      ahead: start > today,
    };
  });
}
