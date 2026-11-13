import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { KIND_LOOK } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { DayMark } from "./DayMark";

/** A day item's kind as a tinted circle, with how it went on its corner: a check once done, a cross once missed. */
export function KindCircle({
  kind,
  badge,
}: {
  kind: WorkoutKind;
  badge: "done" | "missed";
}): React.ReactElement {
  const look = KIND_LOOK[kind];
  return (
    <span className="kind-circle" style={{ background: look.tint, color: look.ink }}>
      {kind === "climbing" || kind === "hangboard" ? (
        <Icon name={kind === "climbing" ? "climb" : "hang"} size={20} strokeWidth={1.9} />
      ) : (
        <DayMark kind={kind} filled scale={1.5} />
      )}
      <span className={`kind-circle-badge kind-circle-badge--${badge}`}>
        <Icon name={badge === "done" ? "check" : "x"} size={12} strokeWidth={3} />
      </span>
    </span>
  );
}
