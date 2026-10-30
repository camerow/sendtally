import React from "react";
import { Pressable, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import type { OccurrenceStatus } from "@sendtally/features/training";
import { press } from "../../../lib/press";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";

export type DayCellProps = {
  kind: WorkoutKind;
  on: boolean;
  size: number;
  /** On a dated day: done fills the mark, planned outlines it, missed greys it. */
  status?: OccurrenceStatus;
  /** A plan with no days yet: outlined in its kind's colour, asking for one. */
  asking?: boolean;
  /** Makes the cell a button, such as one that toggles its weekday. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** One weekday of a plan's week: its kind's mark where it lands, a dot where it does not. */
export function DayCell({
  kind,
  on,
  size,
  status,
  asking = false,
  onPress,
  accessibilityLabel,
}: DayCellProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  const box = {
    width: size,
    height: size,
    borderRadius: size > 24 ? 8 : 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: on ? look.tint : colors.surfaceSoft,
    borderWidth: asking ? 1.5 : 0,
    borderColor: look.ink,
  } as const;
  const mark = on ? (
    <DayMark
      kind={kind}
      filled={status === undefined || status === "done"}
      missed={status === "missed"}
    />
  ) : (
    <View
      style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(64,63,76,0.25)" }}
    />
  );
  return onPress === undefined ? (
    <View style={box}>{mark}</View>
  ) : (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={3}
      style={press(box)}
    >
      {mark}
    </Pressable>
  );
}
