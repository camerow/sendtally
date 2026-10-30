import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";

export type DayCellProps = { kind: WorkoutKind; on: boolean; size: number };

/** One weekday of a plan's week: its kind's mark where it lands, a dot where it does not. */
export function DayCell({ kind, on, size }: DayCellProps): React.ReactElement {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size > 24 ? 8 : 7,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: on ? KIND_LOOK[kind].tint : colors.surfaceSoft,
      }}
    >
      {on ? (
        <DayMark kind={kind} filled />
      ) : (
        <View
          style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(64,63,76,0.25)" }}
        />
      )}
    </View>
  );
}
