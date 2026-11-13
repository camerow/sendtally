import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockEnded,
  blockWeekOn,
  doseIndex,
  isDated,
  itemIdOf,
  sessionItems,
  turnsOf,
  weekday,
  type Block,
  type CalendarDate,
  type Dose,
  type Membership,
  type SessionItem,
  type WeightUnit,
  type Weekday,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { dayMonth } from "../hang/format";
import type { HangModel } from "../hang/model";
import { t } from "../i18n";
import { bodySummary, doseSummary } from "../workouts/library";
import { blockOfMembership } from "./plan";
import { blockWeekColumns } from "./blockWeekDays";
import { trainingDay, type TrainingLog } from "./days";
import { workoutLines, type CellMark } from "./planGridRows";
import { blockRecap, type DoneCount } from "./recap";
import { daysInWeek, scheduleOf, usualDays, type DayToggle } from "./weekDays";

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

/** An exercise's line in its block: its dose as written, and which weeks change it. */
export const loadSummary = (
  kind: WorkoutKind,
  dose: Dose,
  unit: WeightUnit,
  changes: readonly Partial<Dose>[]
): string => [doseSummary(kind, dose, unit), ...changedWeeks(changes)].join(" · ");

/** The list with `x` taken out if it is in, or put in at the end if not, as an open section. */
export const toggleIn = <T>(list: readonly T[], x: T): T[] =>
  list.includes(x) ? list.filter((y) => y !== x) : [...list, x];

/** A workout in its block, as its page reads it for one turn; none once it is gone. */
export type LadderView = {
  membership: Membership;
  block: Block;
  workout: Workout;
  /** How many turns it alternates through, A and B; one when it does not. */
  turns: number;
  /** Its items as run on this turn. */
  items: SessionItem[];
  /** Each item's change per block week on this turn, first week first. */
  changes: Partial<Dose>[][];
  /** Where a week's change to an item is saved. */
  at: (index: number) => { dose: number; itemId: string };
  current: number | null;
  ended: boolean;
  done: (DoneCount | null)[] | null;
  /** What it holds, a line each, under its name. */
  lines: string[];
};

export function ladderView(
  plan: Plan,
  log: TrainingLog,
  model: HangModel,
  membershipId: string,
  turn: number,
  today: CalendarDate
): LadderView | null {
  const membership = plan.memberships.find((x) => x.id === membershipId);
  const block = membership === undefined ? null : blockOfMembership(plan, membership);
  const workout = membership === undefined ? undefined : log.workout(membership.workoutId);
  if (membership === undefined || block === null || workout === undefined) return null;
  const at = (index: number): { dose: number; itemId: string } => ({
    dose: doseIndex(workout.items[index] ?? { doses: [] }, turn),
    itemId: itemIdOf(workout.items[index] ?? {}, index),
  });
  const items = sessionItems(workout.items, turn);
  return {
    membership,
    block,
    workout,
    turns: turnsOf(workout.items),
    items,
    changes: items.map((_, i) =>
      weekChangesOf(plan, { membershipId, weeks: block.weeks, ...at(i) })
    ),
    at,
    current: blockWeekOn(block, today),
    ended: blockEnded(block, today),
    done: ladderDone(log, block, membershipId, today),
    lines:
      workout.kind === "hangboard"
        ? (bodySummary(workout)?.split(" · ") ?? [])
        : workoutLines(workout, model),
  };
}

/** One weekday of a workout's week in its block: on or off, how it went once gone by, or a day to set. */
export type WeekDaysCell = { day: number; on: boolean; mark?: CellMark; toggle?: () => void };

export type WeekDaysRow = {
  key: string;
  name: string;
  sub?: string;
  bold: boolean;
  cells: WeekDaysCell[];
};

export type WeekDaysArgs = {
  block: Block;
  membership: Membership;
  /** The plan with any draft applied. */
  plan: Plan;
  log: TrainingLog;
  today: CalendarDate;
  editing: boolean;
  onToggle: (change: DayToggle) => void;
};

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * A workout's days in its block, a row per week, a day gone by marked by how it went. Editing,
 * an Every week row sets them from this week on (all weeks on a template), and each other cell
 * sets its week alone.
 */
export function weekDaysRows({
  block,
  membership,
  plan,
  log,
  today,
  editing,
  onToggle,
}: WeekDaysArgs): { columns: number[]; every: WeekDaysRow | null; weeks: WeekDaysRow[] } {
  const schedule = scheduleOf(plan, membership);
  const dated = isDated(block) ? block : null;
  const columns = blockWeekColumns(block, 1) ?? DAYS;
  const current = dated === null ? null : blockWeekOn(dated, today);
  const everyFrom = everyWeekFrom(block, today);
  const everyDays = everyFrom === null ? null : usualDays(schedule, everyFrom, block.weeks);
  const every =
    !editing || everyFrom === null || everyDays === null
      ? null
      : {
          key: "every",
          name: t("plan.everyWeek"),
          sub:
            dated === null
              ? t("plan.allWeeks", { count: block.weeks })
              : t("plan.fromWeekOn", { n: everyFrom }),
          bold: true,
          cells: columns.map((day) => ({
            day,
            on: everyDays.includes(day as Weekday),
            toggle: () =>
              onToggle({
                week: everyFrom,
                day: day as Weekday,
                following: true,
                last: block.weeks,
                every: true,
              }),
          })),
        };
  const weeks = Array.from({ length: block.weeks }, (_, i): WeekDaysRow => {
    const week = i + 1;
    const days = daysInWeek(schedule, week);
    const start = dated === null ? null : addDays(dated.start, i * 7);
    return {
      key: `w${week}`,
      name: t("plan.weekNumber", { n: week }),
      ...(start !== null && { sub: dayMonth(start) }),
      bold: week === current,
      cells: columns.map((day): WeekDaysCell => {
        const date = start === null ? null : addDays(start, (day - weekday(start) + 7) % 7);
        if (date !== null && date < today) {
          const mark = ranMark(log, membership.id, date, today);
          return { day, on: mark !== null, ...(mark !== null && { mark }) };
        }
        const on = days.includes(day as Weekday);
        if (!editing) return { day, on };
        return {
          day,
          on,
          toggle: () =>
            onToggle({ week, day: day as Weekday, following: false, last: block.weeks }),
        };
      }),
    };
  });
  return { columns, every, weeks };
}
