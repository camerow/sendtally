import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { KIND_LOOK } from "./kindLook";

export type DayMarkProps = { kind: WorkoutKind; filled: boolean; onDark?: boolean; scale?: number };

/** A day item as its kind's mark: filled once it happened, outlined while planned. */
export function DayMark({
  kind,
  filled,
  onDark = false,
  scale = 1,
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
        ...(filled ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color }),
      }}
    />
  );
}
