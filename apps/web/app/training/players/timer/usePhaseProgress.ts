import React from "react";
import { currentPhase, type Run } from "@sendtally/core/hang";
import { progressMove } from "@sendtally/features/workouts";

const LIFT_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

let registered = false;

function registerProgress(): void {
  if (registered || typeof CSS === "undefined" || !("registerProperty" in CSS)) return;
  registered = true;
  try {
    CSS.registerProperty({ name: "--p", syntax: "<number>", inherits: true, initialValue: "0" });
  } catch {
    return;
  }
}

/**
 * The current phase's 0 to 1 progress as `--p` on the returned element, animated by the
 * browser: the ring and the phase bar's live segment draw from it.
 */
export function usePhaseProgress(run: Run): React.RefObject<HTMLDivElement | null> {
  const el = React.useRef<HTMLDivElement>(null);
  const latest = React.useRef(run);
  React.useEffect(() => {
    latest.current = run;
  });
  const { kind, seconds, taps: needed } = currentPhase(run);
  const { index, phaseStartedAt, pausedAt, taps } = run;

  React.useEffect(() => {
    registerProgress();
    const node = el.current;
    if (node === null) return;
    const shown = Number(getComputedStyle(node).getPropertyValue("--p")) || 0;
    node.getAnimations?.().forEach((a) => a.cancel());
    const { from, to, ms } = progressMove(latest.current, Date.now());
    const start = from ?? shown;
    node.style.setProperty("--p", String(to));
    if (ms > 0 && start !== to)
      node.animate?.([{ "--p": String(start) }, { "--p": String(to) }], {
        duration: ms,
        easing: from === null ? LIFT_EASE : "linear",
      });
  }, [index, kind, seconds, phaseStartedAt, pausedAt, taps, needed]);

  return el;
}
