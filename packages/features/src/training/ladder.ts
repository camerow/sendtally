import type { Plan } from "@sendtally/api-client";
import {
  blockEnded,
  blockWeekOn,
  isDated,
  type Block,
  type CalendarDate,
  type Dose,
} from "@sendtally/core/hang";
import { t } from "../i18n";
import { trainingDay, type TrainingLog } from "./days";
import type { CellMark } from "./planGridRows";
import { blockRecap, type DoneCount } from "./recap";

/** "changes W5, W6"; nothing when no week changes it. */
export function changedWeeks(changes: readonly Partial<Dose>[]): string[] {
  const weeks = changes.flatMap((c, i) =>
    Object.keys(c).length > 0 ? [t("plan.weekShort", { n: i + 1 })] : []
  );
  return weeks.length === 0 ? [] : [t("plan.changesWeeks", { weeks: weeks.join(", ") })];
}

/** Each block week's change to one dose of one item of a workout in its block, first week first. */
export const weekChangesOf = (
  plan: Pick<Plan, "weekChanges">,
  at: { membershipId: string; weeks: number; dose: number; itemId: string }
): Partial<Dose>[] =>
  Array.from(
    { length: at.weeks },
    (_, i) =>
      plan.weekChanges.find(
        (c) =>
          c.membershipId === at.membershipId &&
          c.week === i + 1 &&
          c.dose === at.dose &&
          c.itemId === at.itemId
      )?.change ?? {}
  );

/** Each week's runs of a workout in its block, done of planned, up to this week; none on a template. */
export function ladderDone(
  log: TrainingLog,
  block: Block,
  membershipId: string,
  today: CalendarDate
): (DoneCount | null)[] | null {
  if (!isDated(block)) return null;
  const current = blockWeekOn(block, today);
  const ended = blockEnded(block, today);
  const ran = blockRecap(log, block, today).workouts.find(
    (r) => r.membershipId === membershipId
  )?.weeks;
  return Array.from({ length: block.weeks }, (_, i) =>
    ended || (current !== null && i + 1 <= current) ? (ran?.[i] ?? null) : null
  );
}

/** The week Every week sets days from: this week on, all weeks on a template; none once it has ended. */
export function everyWeekFrom(block: Block, today: CalendarDate): number | null {
  if (!isDated(block) || today < block.start) return 1;
  return blockWeekOn(block, today);
}

/** How a workout went on a day gone by; none when it was not planned or is still to come. */
export function ranMark(
  log: TrainingLog,
  membershipId: string,
  date: CalendarDate,
  today: CalendarDate
): CellMark | null {
  const o = trainingDay(log, date, today).plans.find((x) => x.membership.id === membershipId);
  return o === undefined || o.status === "planned" ? null : o.status;
}
