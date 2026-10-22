import React from "react";
import { Pressable, Text, View } from "react-native";
import { weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayTitle, weekdayShort } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { dayMarks, type TrainingDay } from "@sendtally/features/training";
import { press } from "../../../lib/press";
import { Label } from "../components/Label";
import { ON_DARK_SOFT } from "../components/onDark";
import { type } from "../type";
import { DayMark } from "./DayMark";

export type DayCellProps = { day: TrainingDay; selected: boolean; onPress: () => void };

export function DayCell({ day, selected, onPress }: DayCellProps): React.ReactElement {
  const ground = selected ? colors.gunmetal : day.isToday ? colors.gold : "transparent";
  const ink = selected ? colors.white : colors.gunmetal;
  const marks = dayMarks(day);
  const labelInk = selected
    ? day.isToday
      ? colors.gold
      : ON_DARK_SOFT
    : day.isToday
      ? colors.gunmetal
      : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={t("training.dayAria", {
        day: dayTitle(day.date),
        logged: marks.filter((m) => m.filled).length,
        planned: marks.filter((m) => !m.filled).length,
      })}
      style={press({
        flex: 1,
        height: 70,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        backgroundColor: ground,
      })}
    >
      <Label small color={labelInk} style={{ letterSpacing: 0.4 }}>
        {day.isToday ? t("training.today") : weekdayShort(weekday(day.date))}
      </Label>
      <Text style={[type.monoBold, { fontSize: 17, lineHeight: 18, color: ink }]}>
        {Number(day.date.slice(8))}
      </Text>
      <View style={{ height: 8, flexDirection: "row", alignItems: "center", gap: 3 }}>
        {marks.map((m, i) => (
          <DayMark key={i} kind={m.kind} filled={m.filled} onDark={selected} />
        ))}
      </View>
    </Pressable>
  );
}
