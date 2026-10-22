import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { CalendarDate } from "@sendtally/core/hang";
import type { TrainingDay } from "@sendtally/features/training";
import { Label } from "../components/Label";
import { CalendarDay } from "./CalendarDay";

const BLOCK_TINT = "rgba(249,220,92,0.28)";

export type CalendarWeekProps = {
  days: readonly TrainingDay[];
  month: CalendarDate;
  /** The block over the week, or the weeks being picked: a band with its label. */
  band: string | null;
  picked: boolean;
  onPress: (date: CalendarDate) => void;
};

/** A week row: the band of the block it is in, then its seven days. */
export function CalendarWeek({
  days,
  month,
  band,
  picked,
  onPress,
}: CalendarWeekProps): React.ReactElement {
  return (
    <View style={{ borderRadius: 12, backgroundColor: picked ? BLOCK_TINT : undefined }}>
      <View
        style={{
          height: 16,
          marginTop: 4,
          marginHorizontal: 2,
          paddingHorizontal: 6,
          borderRadius: 5,
          justifyContent: "center",
          backgroundColor: band === null ? undefined : picked ? colors.gold : BLOCK_TINT,
        }}
      >
        {band !== null && (
          <Label small color={colors.gunmetal} style={{ fontSize: 9 }}>
            {band}
          </Label>
        )}
      </View>
      <View style={{ flexDirection: "row" }}>
        {days.map((day) => (
          <CalendarDay
            key={day.date}
            day={day}
            inMonth={day.date.slice(0, 7) === month.slice(0, 7)}
            onPress={() => onPress(day.date)}
          />
        ))}
      </View>
    </View>
  );
}
