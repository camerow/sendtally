import React from "react";
import type { Plan } from "@sendtally/api-client";
import {
  isDated,
  type Block,
  type CalendarDate,
  type Membership,
  type Weekday,
} from "@sendtally/core/hang";
import type { HangModel } from "../hang/model";
import { blockWeekColumns, blockWeekDates, cellMark, weekPlans } from "./blockWeekDays";
import type { TrainingLog } from "./days";
import type { Occurrence, WorkoutLookup } from "./plan";
import { planGridRows, type CellMark, type GridOptions, type PlanGridRow } from "./planGridRows";
import {
  daysInWeek,
  hasDays,
  scheduleOf,
  withFollowing,
  withoutFollowing,
  type DaySchedule,
  type DayToggle,
} from "./weekDays";

export type BlockWeekGridArgs = {
  block: Block;
  members: readonly Membership[];
  /** The plan with any draft applied. */
  plan: Plan;
  log: TrainingLog;
  model: HangModel;
  workout: WorkoutLookup;
  today: CalendarDate;
  /** The week shown; none reads the week as written. */
  week: number | undefined;
  editing: boolean;
  onToggle?: (membershipId: string, change: DayToggle) => void;
  onSchedules?: (schedules: readonly DaySchedule[]) => void;
  /** Opens a row: its weeks inside the block. */
  open: (m: Membership) => void;
  /** Opens a planned day from today on; none where the platform cannot. */
  openDay: (o: Occurrence, m: Membership) => (() => void) | undefined;
};

export type BlockWeekGrid = {
  rows: PlanGridRow[];
  /** A dated week's day numbers by weekday, Monday first; none on a template. */
  dates: string[] | undefined;
  /** The weekdays left to right, from a dated week's first day. */
  columns: number[] | undefined;
  /** Whether a day set in Edit mode reaches the following weeks, and the switch for it. */
  following: boolean;
  setFollowing: (on: boolean) => void;
  /** The week shown, the first when none is picked. */
  shownWeek: number;
  /** Workouts with no day in any week, such as ones just added. */
  dayless: Membership[];
};

/**
 * A block's week as grid rows: a scheduled week marked by how each day went, a template week
 * past the first read with its changes, and in Edit mode each day from today on to set, with
 * Apply to following weeks turned on and off.
 */
export function useBlockWeekGrid({
  block,
  members,
  plan,
  log,
  model,
  workout,
  today,
  week,
  editing,
  onToggle,
  onSchedules,
  open,
  openDay,
}: BlockWeekGridArgs): BlockWeekGrid {
  const shownWeek = week ?? 1;
  // The days before Apply to following weeks went on, which turning it off puts back.
  const [before, setBefore] = React.useState<readonly DaySchedule[] | null>(null);
  const [wasShowing, setWasShowing] = React.useState({ editing, shownWeek });
  if (editing !== wasShowing.editing || shownWeek !== wasShowing.shownWeek) {
    setWasShowing({ editing, shownWeek });
    setBefore(null);
  }
  const following = before !== null;
  const setFollowing = (on: boolean): void => {
    const now = members.map((m) => scheduleOf(plan, m));
    onSchedules?.(
      now.map((s, i) =>
        on
          ? withFollowing(s, shownWeek, block.weeks)
          : withoutFollowing(s, before?.[i] ?? s, shownWeek, block.weeks)
      )
    );
    setBefore(on ? now : null);
  };
  const dates = blockWeekDates(block, week);
  const statuses = dates === null ? null : weekPlans(log, dates, today);
  const marks =
    statuses === null
      ? undefined
      : (m: Membership): (CellMark | null)[] => statuses.map((plans) => cellMark(plans, m.id));
  const options: GridOptions = editing
    ? {
        open,
        ...(marks !== undefined && { marks }),
        // A day gone by keeps how it went; today and later are set.
        toggle: (m: Membership, day: number) =>
          dates !== null && (dates[day] ?? today) < today
            ? undefined
            : () =>
                onToggle?.(m.id, {
                  week: shownWeek,
                  day: day as Weekday,
                  following,
                  last: block.weeks,
                }),
      }
    : {
        open,
        ...(!isDated(block) &&
          week !== undefined &&
          week > 1 && {
            week: { n: week, changes: plan.weekChanges, unit: model.settings.units },
          }),
        ...(marks !== undefined && {
          marks,
          // A planned day from today on opens its day; anything else opens the workout.
          press: (m: Membership, day: number) => {
            const o = statuses?.[day]?.find((x) => x.membership.id === m.id);
            return o === undefined || o.status !== "planned" ? undefined : openDay(o, m);
          },
        }),
      };
  const shown = members.map((m) => ({
    ...m,
    weekdays: daysInWeek(scheduleOf(plan, m), shownWeek),
  }));
  return {
    rows: planGridRows(shown, workout, model, options),
    dates: dates?.map((d) => String(Number(d.slice(8)))),
    columns: blockWeekColumns(block, week),
    following,
    setFollowing,
    shownWeek,
    dayless: members.filter((m) => !hasDays(scheduleOf(plan, m))),
  };
}
