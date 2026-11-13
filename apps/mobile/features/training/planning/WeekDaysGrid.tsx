import React from "react";
import { Text, View } from "react-native";
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
import { colors } from "@sendtally/design/tokens";
import { dayMonth, weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockWeekColumns,
  daysInWeek,
  everyWeekFrom,
  ranMark,
  scheduleOf,
  usualDays,
  type DayToggle,
  type TrainingLog,
  type CellMark,
} from "@sendtally/features/training";
import { Label } from "../components/Label";
import { DayCell } from "../plan/DayCell";
import { type } from "../type";

const CELL = 28;
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

/**
 * A workout's days in its block, a row per week. A day gone by shows how it went. Editing, Every week on top sets them from this week
 * on (all weeks on a template), and each cell sets its week alone.
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
  // From this week on; none once the block has ended.
  const everyFrom = everyWeekFrom(block, today);
  const every = everyFrom === null ? null : usualDays(schedule, everyFrom, block.weeks);
  const columns = blockWeekColumns(block, 1) ?? DAYS;
  const weeks = Array.from({ length: block.weeks }, (_, i) => i + 1);

  const markOn = (date: CalendarDate): CellMark | null => ranMark(log, membership.id, date, today);

  const current = dated === null ? null : blockWeekOn(dated, today);
  const row = (
    key: string,
    label: { name: string; sub?: string; bold?: boolean },
    days: readonly Weekday[],
    cell: (day: number) => { mark?: CellMark | null; onPress?: () => void }
  ): React.ReactElement => (
    <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            label.bold === true ? type.monoBold : type.mono,
            { fontSize: 12, color: label.bold === true ? colors.gunmetal : colors.textSecondary },
          ]}
        >
          {label.name}
        </Text>
        {label.sub !== undefined && (
          <Text numberOfLines={1} style={[type.mono, { fontSize: 10.5, color: colors.textMuted }]}>
            {label.sub}
          </Text>
        )}
      </View>
      {columns.map((day) => {
        const { mark, onPress } = cell(day);
        return (
          <DayCell
            key={day}
            kind={kind}
            on={mark === undefined ? days.includes(day as Weekday) : mark !== null}
            size={CELL}
            status={mark ?? undefined}
            onPress={onPress}
            editing={onPress !== undefined}
            accessibilityLabel={`${label.name}, ${weekdayLong(day)}`}
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
      {editing && every !== null && everyFrom !== null && (
        <View
          style={{
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLightSoft,
          }}
        >
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
        </View>
      )}
      {weeks.map((week) => {
        const days = daysInWeek(schedule, week);
        const start = dated === null ? null : addDays(dated.start, (week - 1) * 7);
        return row(
          `w${week}`,
          {
            name: t("plan.weekNumber", { n: week }),
            ...(start !== null && { sub: dayMonth(start) }),
            bold: week === current,
          },
          days,
          (day) => {
            const date = start === null ? null : addDays(start, (day - weekday(start) + 7) % 7);
            if (date !== null && date < today) return { mark: markOn(date) };
            if (!editing) return {};
            return {
              onPress: () =>
                onToggle({ week, day: day as Weekday, following: false, last: block.weeks }),
            };
          }
        );
      })}
    </View>
  );
}
