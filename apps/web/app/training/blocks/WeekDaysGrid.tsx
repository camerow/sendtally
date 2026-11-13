import React from "react";
import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockWeekOn,
  isDated,
  weekday,
  type Block,
  type CalendarDate,
  type Membership,
  type Weekday,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { dayMonth, weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockWeekColumns,
  daysInWeek,
  everyWeekFrom,
  ranMark,
  scheduleOf,
  usualDays,
  type CellMark,
  type DayToggle,
  type TrainingLog,
} from "@sendtally/features/training";
import { GridCell } from "../components/GridCell";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export type WeekDaysGridProps = {
  block: Block;
  membership: Membership;
  kind: WorkoutKind;
  log: TrainingLog;
  /** The plan with any draft applied, which the days read from. */
  plan: Plan;
  today: CalendarDate;
  /** Every week on top and each day from today on a field, set through `onToggle`. */
  editing: boolean;
  onToggle: (change: DayToggle) => void;
};

type RowLabel = { name: string; sub?: string; bold?: boolean };
type Cell = { mark?: CellMark | null; onPress?: () => void };

/**
 * A workout's days in its block, a row per week; a day gone by shows how it went. Editing,
 * Every week on top sets them from this week on (all weeks on a template), and each cell sets
 * its week alone.
 */
export function WeekDaysGrid({
  block,
  membership,
  kind,
  log,
  plan,
  today,
  editing,
  onToggle,
}: WeekDaysGridProps): React.ReactElement {
  const schedule = scheduleOf(plan, membership);
  const dated = isDated(block) ? block : null;
  const everyFrom = everyWeekFrom(block, today);
  const every = everyFrom === null ? null : usualDays(schedule, everyFrom, block.weeks);
  const columns = blockWeekColumns(block, 1) ?? DAYS;
  const current = dated === null ? null : blockWeekOn(dated, today);
  const weeks = Array.from({ length: block.weeks }, (_, i) => i + 1);

  const row = (
    key: string,
    label: RowLabel,
    days: readonly Weekday[],
    cell: (day: number) => Cell
  ): React.ReactElement => (
    <div key={key} className="week-days-row">
      <span className="week-days-name">
        <span className={label.bold === true ? "week-days-week is-bold" : "week-days-week"}>
          {label.name}
        </span>
        {label.sub !== undefined && <span className="week-days-sub">{label.sub}</span>}
      </span>
      {columns.map((day) => {
        const { mark, onPress } = cell(day);
        return (
          <GridCell
            key={day}
            kind={kind}
            on={mark === undefined ? days.includes(day as Weekday) : mark !== null}
            {...(mark != null && { status: mark })}
            {...(onPress !== undefined && { onPress, editing: true })}
            label={`${label.name}, ${weekdayLong(day)}`}
          />
        );
      })}
    </div>
  );

  return (
    <section className="week-days">
      <div className="week-days-row week-days-head">
        <span className="week-days-name plan-label-small">{t("plan.days")}</span>
        {columns.map((day) => (
          <span key={day} className="week-days-letter plan-label-small plan-label--muted">
            {weekdayLetters()[day]}
          </span>
        ))}
      </div>
      {editing && every !== null && everyFrom !== null && (
        <div className="week-days-every">
          {row(
            "every",
            {
              name: t("plan.everyWeek"),
              sub:
                dated === null
                  ? t("plan.allWeeks", { count: block.weeks })
                  : t("plan.fromWeekOn", { n: everyFrom }),
              bold: true,
            },
            every,
            (day) => ({
              onPress: () =>
                onToggle({
                  week: everyFrom,
                  day: day as Weekday,
                  following: true,
                  last: block.weeks,
                  every: true,
                }),
            })
          )}
        </div>
      )}
      {weeks.map((week) => {
        const start = dated === null ? null : addDays(dated.start, (week - 1) * 7);
        return row(
          `w${week}`,
          {
            name: t("plan.weekNumber", { n: week }),
            ...(start !== null && { sub: dayMonth(start) }),
            bold: week === current,
          },
          daysInWeek(schedule, week),
          (day) => {
            const date = start === null ? null : addDays(start, (day - weekday(start) + 7) % 7);
            if (date !== null && date < today)
              return { mark: ranMark(log, membership.id, date, today) };
            if (!editing) return {};
            return {
              onPress: () =>
                onToggle({ week, day: day as Weekday, following: false, last: block.weeks }),
            };
          }
        );
      })}
    </section>
  );
}
