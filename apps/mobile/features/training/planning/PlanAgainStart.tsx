import React from "react";
import { Text, View } from "react-native";
import { addDays, weekday, type Block, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { blockMembers, hasDays, scheduleOf, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { MonthCalendar } from "../components/MonthCalendar";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";

export type PlanAgainStartProps = {
  block: Block;
  start: CalendarDate;
  onPick: (date: CalendarDate) => void;
};

/** The day a block's copy starts, its weeks running from that weekday, and which of its workouts have no days yet. */
export function PlanAgainStart({ block, start, onPick }: PlanAgainStartProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const last = addDays(start, block.weeks * 7 - 1);
  const dayless =
    block.start === null
      ? blockMembers(log.plan, block)
          .filter((m) => !hasDays(scheduleOf(log.plan, m)))
          .flatMap((m) => log.workout(m.workoutId)?.name ?? [])
      : [];
  const note = [type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }];
  return (
    <View style={{ gap: 20 }}>
      <MonthCalendar
        selected={start}
        picked={[start]}
        min={today}
        today={today}
        shaded={(d) => d > start && d < addDays(start, 7)}
        onPick={onPick}
      />
      <Text style={note}>
        {t("plan.startsRange", {
          start: shortDate(start),
          end: shortDate(last),
          from: weekdayLong(weekday(start)),
          to: weekdayLong(weekday(last)),
        })}
      </Text>
      {dayless.length > 0 && (
        <Text style={note}>
          {t("plan.noDaysYet", { count: dayless.length, workouts: dayless.join(", ") })}
        </Text>
      )}
    </View>
  );
}
