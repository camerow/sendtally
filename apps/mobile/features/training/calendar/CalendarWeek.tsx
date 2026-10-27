import React from "react";
import { View } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import type { TrainingDay } from "@sendtally/features/training";
import { BLOCK_TINT, BlockBand } from "../components/BlockBand";
import { CalendarDay } from "./CalendarDay";

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
      <BlockBand label={band} strong={picked} />
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
