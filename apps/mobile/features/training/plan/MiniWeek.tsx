import React from "react";
import { View } from "react-native";
import { weekday, type Membership, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { daysList } from "@sendtally/features/hang";
import { KIND_LOOK } from "../today/kindLook";

export type MiniWeekProps = {
  kind: WorkoutKind;
  m: Pick<Membership, "weekdays" | "start" | "blockId">;
};

/** The seven days a plan lands on, small: its weekdays, or the one day a one-off falls on. */
export function MiniWeek({ kind, m }: MiniWeekProps): React.ReactElement {
  // A one-off outside a block lands on its start; a block plan with no days has none yet.
  const days: readonly number[] =
    m.weekdays.length > 0 || m.blockId !== null ? m.weekdays : [weekday(m.start)];
  return (
    <View accessible accessibilityLabel={daysList(days)} style={{ flexDirection: "row", gap: 3 }}>
      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <View
          key={day}
          style={{
            width: 16,
            height: 16,
            borderRadius: 5,
            backgroundColor: days.includes(day) ? KIND_LOOK[kind].ink : colors.lineOnLight,
          }}
        />
      ))}
    </View>
  );
}
