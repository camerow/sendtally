import React from "react";
import { Pressable, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";
import type { CellMark } from "./planGridRows";

export type DayCellProps = {
  kind: WorkoutKind;
  on: boolean;
  size: number;
  /**
   * On a dated day: done fills the mark, planned outlines it, missed greys it, skipped is
   * slashed, moved away is outlined with an arrow, and moved in carries an azure dot.
   */
  status?: CellMark;
  /** A plan with no days yet: outlined in its kind's colour, asking for one. */
  asking?: boolean;
  /** Makes the cell a button: a weekday to toggle, or with `opens` a day to open. */
  onPress?: () => void;
  opens?: boolean;
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
  opens = false,
  accessibilityLabel,
}: DayCellProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  const box = {
    width: size,
    height: size,
    borderRadius: size > 24 ? 8 : 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: status === "moved" ? colors.white : on ? look.tint : colors.surfaceSoft,
    borderWidth: asking ? 1.5 : status === "moved" ? 1 : 0,
    borderColor: status === "moved" ? colors.lineOnLightStrong : look.ink,
  } as const;
  const mark =
    status === "skipped" ? (
      <View
        style={{
          width: size * 0.55,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: colors.textFaint,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    ) : status === "moved" ? (
      <Icon name="chevron" size={11} strokeWidth={2.2} color={colors.textMuted} />
    ) : on ? (
      <>
        <DayMark
          kind={kind}
          filled={status === undefined || status === "done"}
          missed={status === "missed"}
        />
        {status === "movedIn" && (
          <View
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.azure,
            }}
          />
        )}
      </>
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
      accessibilityRole={opens ? "button" : "checkbox"}
      accessibilityState={opens ? undefined : { checked: on }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
      style={press(box)}
    >
      {mark}
    </Pressable>
  );
}
