import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
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
  const width = look.shape.width * scale;
  const height = look.shape.height * scale;
  // iOS breaks a dashed border on corners of different radii, so a missed mark is drawn.
  if (missed && !filled) {
    const i = 0.75;
    const [w, h] = [width - i, height - i];
    const r = [tl, tr, br, bl].map((c) => Math.max(0, c - i));
    const [a = 0, b = 0, c = 0, d = 0] = r;
    const path = [
      `M${i + a} ${i}H${w - b}`,
      `A${b} ${b} 0 0 1 ${w} ${i + b}V${h - c}`,
      `A${c} ${c} 0 0 1 ${w - c} ${h}H${i + d}`,
      `A${d} ${d} 0 0 1 ${i} ${h - d}V${i + a}`,
      `A${a} ${a} 0 0 1 ${i + a} ${i}Z`,
    ].join("");
    return (
      <Svg width={width} height={height}>
        <Path
          d={path}
          fill="none"
          stroke={colors.textMuted}
          strokeWidth={1.5}
          strokeDasharray="2 1.5"
        />
      </Svg>
    );
  }
  return (
    <View
      style={{
        width,
        height,
        borderTopLeftRadius: tl,
        borderTopRightRadius: tr,
        borderBottomRightRadius: br,
        borderBottomLeftRadius: bl,
        ...(filled ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color }),
      }}
    />
  );
}
