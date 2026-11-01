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
import { dayMonth, weekdayLetters, weekdayLong } from "@sendtally/features/hang";
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
 * A workout's days in its block: Every week on top, set from this week on (all weeks on a
 * template), then a row per week, each cell setting that week alone. A day ringed in gold is
 * set apart from every week, or on a template from week 1; a day gone by shows how it went.
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

  const current = dated === null ? null : blockWeekOn(dated, today);
  const row = (
    key: string,
    label: { name: string; sub?: string; bold?: boolean },
    days: readonly Weekday[],
    cell: (day: number) => { mark?: CellMark | null; onPress?: () => void },
    differs: (day: number) => boolean
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
            ring={mark === undefined && differs(day)}
            onPress={onPress}
            editing={onPress !== undefined}
            accessibilityLabel={`${label.name}, ${weekdayLong(day)}`}
          />
        );
      })}
    </View>
  );
  // Gold where a week is set apart: from every week, or on a template from week 1.
  const reference = dated === null ? daysInWeek(schedule, 1) : every;

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
      {every !== null && everyFrom !== null && (
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
        </View>
      )}
      {weeks.map((week) => {
        const days = daysInWeek(schedule, week);
        const start = dated === null ? null : addDays(dated.start, (week - 1) * 7);
        return row(
          `w${week}`,
          {
            name: t("plan.weekShort", { n: week }),
            ...(start !== null && { sub: dayMonth(start) }),
            bold: week === current,
          },
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
                  // On a template week 1 is as written: weeks set apart keep their days.
                  last: dated === null && week === 1 ? 1 : block.weeks,
                }),
            };
          },
          (day) =>
            reference !== null &&
            week >= (dated === null ? 2 : (everyFrom ?? 1)) &&
            days.includes(day as Weekday) !== reference.includes(day as Weekday)
        );
      })}
    </View>
  );
}
