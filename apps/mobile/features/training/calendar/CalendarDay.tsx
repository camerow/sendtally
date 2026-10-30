import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { TrainingDay } from "@sendtally/features/training";
import { press } from "../../../lib/press";
import { DayMark } from "../today/DayMark";
import { type } from "../type";

export type CalendarDayProps = { day: TrainingDay; inMonth: boolean; onPress: () => void };

/** One day on the month: its number, today in a dark circle, and a mark per planned workout. */
export function CalendarDay({ day, inMonth, onPress }: CalendarDayProps): React.ReactElement {
  const plans = day.plans.filter((o) => o.workout !== undefined);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("calendar.dayAria", { day: dayTitle(day.date), n: plans.length })}
      style={press({
        flex: 1,
        height: 56,
        alignItems: "center",
        gap: 4,
        paddingTop: 4,
        opacity: inMonth ? 1 : 0.4,
      })}
    >
      <View
        style={{
          minWidth: 26,
          height: 26,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: day.isToday ? colors.gunmetal : undefined,
        }}
      >
        <Text
          style={[
            type.monoBold,
            {
              fontSize: 13,
              color: day.isToday
                ? colors.white
                : day.isPast
                  ? colors.textSecondary
                  : colors.gunmetal,
            },
          ]}
        >
          {Number(day.date.slice(8))}
        </Text>
      </View>
      <View
        style={{
          maxWidth: 40,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
        }}
      >
        {plans.map((o) =>
          o.workout === undefined ? null : (
            <DayMark
              key={o.membership.id}
              kind={o.workout.kind}
              filled={o.status === "done"}
              missed={o.status === "missed"}
            />
          )
        )}
      </View>
    </Pressable>
  );
}
