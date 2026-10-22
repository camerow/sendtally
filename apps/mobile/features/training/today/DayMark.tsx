import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { KIND_LOOK } from "./kindLook";

export type DayMarkProps = {
  kind: WorkoutKind;
  filled: boolean;
  onDark?: boolean;
  scale?: number;
  missed?: boolean;
};

/** A day item as its kind's mark: filled once it happened, outlined while planned, grey dashed once missed. */
export function DayMark({
  kind,
  filled,
  onDark = false,
  scale = 1,
  missed = false,
}: DayMarkProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  const color = onDark ? look.onDark : look.ink;
  const [tl = 0, tr = 0, br = 0, bl = 0] = look.shape.radii.map((r) => r * scale);
  return (
    <View
      style={{
        width: look.shape.width * scale,
        height: look.shape.height * scale,
        borderTopLeftRadius: tl,
        borderTopRightRadius: tr,
        borderBottomRightRadius: br,
        borderBottomLeftRadius: bl,
        ...(filled
          ? { backgroundColor: color }
          : missed
            ? { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.textMuted }
            : { borderWidth: 1.5, borderColor: color }),
      }}
    />
  );
}
