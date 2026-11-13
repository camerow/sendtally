import React from "react";
import { isWork, type Phase } from "@sendtally/core/hang";

export type PhaseBarProps = { phases: readonly Pick<Phase, "kind" | "seconds">[]; height: number };

/** Work as tall blue segments, rest as short green ones, widths by duration. */
export function PhaseBar({ phases, height }: PhaseBarProps): React.ReactElement {
  return (
    <div className="phase-bar" style={{ height }} aria-hidden="true">
      {phases.map((p, i) => (
        <span
          key={i}
          className={isWork(p.kind) ? "phase-work" : "phase-rest"}
          style={{
            flexGrow: p.seconds,
            height: isWork(p.kind) ? height : Math.round(height * 0.42),
          }}
        />
      ))}
    </div>
  );
}
