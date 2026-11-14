import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { KIND_LOOK } from "@sendtally/features/training";

export type CategoryMarkProps = { kind: WorkoutKind; size?: number };

/** A kind's mark on its tint, the way it shows wherever a workout or plan is picked. */
export function CategoryMark({ kind, size = 36 }: CategoryMarkProps): React.ReactElement {
  const { ink, tint, shape } = KIND_LOOK[kind];
  const scale = size / 24;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: tint,
      }}
    >
      <span
        style={{
          width: shape.width * scale,
          height: shape.height * scale,
          borderRadius: shape.radii.map((r) => `${r * scale}px`).join(" "),
          background: ink,
        }}
      />
    </span>
  );
}
