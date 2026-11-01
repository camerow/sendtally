import React from "react";
import { Text, View } from "react-native";
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
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  daysInWeek,
  scheduleOf,
  trainingDay,
  usualDays,
  type TrainingLog,
} from "@sendtally/features/training";
import { Label } from "../components/Label";
import { DayCell } from "../plan/DayCell";
import type { CellMark } from "../plan/planGridRows";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";

const CELL = 28;
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export type WeekDaysGridProps = {
  block: Block;
  membership: Membership;
  kind: WorkoutKind;
  log: TrainingLog;
  today: CalendarDate;
};

/**
 * A workout's days in its block: Every week on top, set from this week on (every week on a
 * template), then a row per week, each cell setting that week alone. A week ringed in gold
 * is set apart from every week; a day gone by shows how it went.
 */
export function WeekDaysGrid({
  block,
  membership,
  kind,
  log,
  today,
}: WeekDaysGridProps): React.ReactElement {
  const actions = usePlanActions();
  const schedule = scheduleOf(log.plan, membership);
  const dated = isDated(block) ? block : null;
  // From this week on; none once the block has ended.
  const everyFrom = dated === null ? 1 : today < dated.start ? 1 : blockWeekOn(dated, today);
  const every = everyFrom === null ? null : usualDays(schedule, everyFrom, block.weeks);
  const columns = dated === null ? DAYS : DAYS.map((i) => weekday(addDays(dated.start, i)));
  const weeks = Array.from({ length: block.weeks }, (_, i) => i + 1);

  const markOn = (date: CalendarDate): CellMark | null => {
    const o = trainingDay(log, date, today).plans.find((x) => x.membership.id === membership.id);
    return o === undefined ? null : o.status === "planned" ? null : o.status;
  };

  const row = (
    key: string,
    label: string,
    days: readonly Weekday[],
    cell: (day: number) => { mark?: CellMark | null; onPress?: () => void },
    differs: (day: number) => boolean
  ): React.ReactElement => (
    <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Text
        numberOfLines={1}
        style={[type.mono, { flex: 1, fontSize: 12, color: colors.textSecondary }]}
      >
        {label}
      </Text>
      {columns.map((day) => {
        const { mark, onPress } = cell(day);
        return (
          <DayCell
            key={day}
            kind={kind}
            on={mark === undefined ? days.includes(day as Weekday) : mark !== null}
            size={CELL}
            status={mark ?? undefined}
            ring={mark === undefined && differs(day)}
            onPress={onPress}
            accessibilityLabel={`${label}, ${weekdayLong(day)}`}
          />
        );
      })}
    </View>
  );

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Label small color={colors.gunmetal} style={{ flex: 1 }}>
          {t("plan.days")}
        </Label>
        {columns.map((day) => (
          <Label
            key={day}
            small
            color={colors.textSecondary}
            style={{ width: CELL, textAlign: "center" }}
          >
            {weekdayLetters()[day]}
          </Label>
        ))}
      </View>
      {every !== null &&
        everyFrom !== null &&
        row(
          "every",
          t("plan.everyWeek"),
          every,
          (day) => ({
            onPress: () =>
              void actions.toggleWeekDay(membership.id, {
                week: everyFrom,
                day: day as Weekday,
                following: true,
                last: block.weeks,
                every: true,
              }),
          }),
          () => false
        )}
      {weeks.map((week) => {
        const days = daysInWeek(schedule, week);
        const start = dated === null ? null : addDays(dated.start, (week - 1) * 7);
        return row(
          `w${week}`,
          t("plan.weekShort", { n: week }),
          days,
          (day) => {
            const date = start === null ? null : addDays(start, (day - weekday(start) + 7) % 7);
            if (date !== null && date < today) return { mark: markOn(date) };
            return {
              onPress: () =>
                void actions.toggleWeekDay(membership.id, {
                  week,
                  day: day as Weekday,
                  following: false,
                  last: block.weeks,
                }),
            };
          },
          (day) =>
            every !== null &&
            week >= (everyFrom ?? 1) &&
            days.includes(day as Weekday) !== every.includes(day as Weekday)
        );
      })}
    </View>
  );
}
