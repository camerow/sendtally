import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { KIND_LOOK } from "@sendtally/features/training";

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
  const dashed = missed && !filled;
  return (
    <span
      aria-hidden="true"
      className="day-mark"
      style={{
        width: look.shape.width * scale,
        height: look.shape.height * scale,
        borderRadius: look.shape.radii.map((r) => `${r * scale}px`).join(" "),
        ...(filled
          ? { background: color }
          : {
              border: `1.5px ${dashed ? "dashed" : "solid"} ${dashed ? colors.textMuted : color}`,
            }),
      }}
    />
  );
}
