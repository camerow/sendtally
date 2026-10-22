import type { PlanItem } from "@sendtally/api-client";
import {
  addDays,
  BASE_WEEK_LOAD,
  blockEnd,
  occursOn,
  totalSeconds,
  type BlockPhase,
  type CalendarDate,
  type Schedule,
  type TrainingBlock,
} from "@sendtally/core/hang";
import { trainingLoad } from "../activities/plan";
import { isUnscored } from "../sessions/meta";
import { sessionMinutes } from "../sessions/years";
import { climbDate, type TrainingLog } from "./days";

/** One week of a block: effort as minutes times RPE, planned from targets and logged from sessions. */
export type BlockWeek = {
  week: number;
  start: CalendarDate;
  phase: BlockPhase | null;
  /** Percent of the block's base load. */
  load: number;
  planned: number;
  actual: number;
  /** Not started yet, so nothing logged counts against it. */
  ahead: boolean;
};

export type BlockMembers = { items: PlanItem[]; schedules: Schedule[] };

export function blockMembers(
  block: Pick<TrainingBlock, "id">,
  items: readonly PlanItem[],
  schedules: readonly Schedule[]
): BlockMembers {
  return {
    items: items.filter((i) => i.blockId === block.id),
    schedules: schedules.filter((s) => s.blockId === block.id),
  };
}

const effort = (minutes: number | null, rpe: number | null | undefined): number =>
  minutes === null || rpe === null || rpe === undefined ? 0 : minutes * rpe;

function plannedIn(
  dates: readonly CalendarDate[],
  members: BlockMembers,
  workoutMinutes: (id: string) => number | null
): number {
  const items = members.items.reduce((sum, item) => {
    const times = item.perWeek ?? dates.filter((d) => occursOn(item, d)).length;
    return sum + times * effort(item.minutes, item.targetRpe);
  }, 0);
  const hangs = members.schedules.reduce(
    (sum, s) =>
      sum +
      dates.filter((d) => occursOn(s, d)).length * effort(workoutMinutes(s.workoutId), s.targetRpe),
    0
  );
  return items + hangs;
}

function actualIn(dates: ReadonlySet<CalendarDate>, log: TrainingLog): number {
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
 * Each week of the block, planned against actual. Planned counts members with both
 * minutes and a target effort, scaled by the week's load; actual counts everything logged that week, inside the
 * block or not, since a block plans the whole week.
 */
export function blockWeeks(
  block: TrainingBlock,
  members: BlockMembers,
  log: TrainingLog,
  workoutMinutes: (id: string) => number | null,
  today: CalendarDate
): BlockWeek[] {
  const end = blockEnd(block);
  return block.loads.flatMap(({ load, phase }, i): BlockWeek[] => {
    const start = addDays(block.start, i * 7);
    if (start >= end) return [];
    const dates = Array.from({ length: 7 }, (_, d) => addDays(start, d)).filter((d) => d < end);
    return [
      {
        week: i + 1,
        start,
        phase: phase ?? null,
        load,
        planned: Math.round((plannedIn(dates, members, workoutMinutes) * load) / BASE_WEEK_LOAD),
        actual: Math.round(actualIn(new Set(dates), log)),
        ahead: start > today,
      },
    ];
  });
}
