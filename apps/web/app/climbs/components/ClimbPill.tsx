import React from "react";
import type { ClimbPillKind } from "@sendtally/features/climbs";
import { climbPills } from "@sendtally/design/tokens";

const PILLS: Record<ClimbPillKind, { fill: string; ink: string; line?: string }> = climbPills;

/** How a climb went, as a small status pill. */
export function ClimbPill({
  kind,
  label,
}: {
  kind: ClimbPillKind;
  label: string;
}): React.ReactElement {
  const look = PILLS[kind];
  return (
    <span
      className="climb-pill"
      style={{
        background: look.fill,
        color: look.ink,
        borderColor: look.line ?? "transparent",
      }}
    >
      {label}
    </span>
  );
}
