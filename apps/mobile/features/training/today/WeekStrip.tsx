import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { weekRange, weekTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { TrainingDay } from "@sendtally/features/training";
import type { CalendarDate } from "@sendtally/core/hang";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { type } from "../type";
import { DayCell } from "./DayCell";
import { StripLegend } from "./StripLegend";

export type WeekStripProps = {
  offset: number;
  days: readonly TrainingDay[];
  selected: CalendarDate;
  onSelect: (date: CalendarDate) => void;
  onOffset: (offset: number) => void;
};

export function WeekStrip({
  offset,
  days,
  selected,
  onSelect,
  onOffset,
}: WeekStripProps): React.ReactElement {
  const monday = days[0]?.date ?? selected;
  return (
    <View
      style={{
        gap: 10,
        paddingTop: 6,
        paddingHorizontal: 8,
        paddingBottom: 10,
        borderRadius: 16,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6 }}>
        <Label color={colors.gunmetal} style={{ flex: 1 }}>
          {weekTitle(offset)}
        </Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {weekRange(monday)}
        </Text>
        <IconButton
          icon="back"
          label={t("hang.previousWeek")}
          onPress={() => onOffset(offset - 1)}
          color={colors.gunmetal}
          size={36}
        />
        <IconButton
          icon="forward"
          label={t("hang.nextWeek")}
          onPress={() => onOffset(offset + 1)}
          color={colors.gunmetal}
          size={36}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            selected={day.date === selected}
            onPress={() => onSelect(day.date)}
          />
        ))}
      </View>
      <StripLegend />
    </View>
  );
}
