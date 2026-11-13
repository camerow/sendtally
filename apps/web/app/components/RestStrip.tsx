import React from "react";
import { stripVM, useHold, useRest } from "@sendtally/features/workouts";
import { useLiveRunStore } from "../lib/useLiveRun";

/**
 * The live run's rest or timed set while its player is minimised: a slim line under the live
 * bar, gold draining for a rest, green filling for a hold.
 */
export function RestStrip(): React.ReactElement | null {
  const store = useLiveRunStore();
  const { rest, left } = useRest(store);
  const { hold, now } = useHold(store);
  const vm = stripVM(rest, left, hold, now);
  if (vm === null) return null;
  return (
    <div
      className="rest-strip"
      {...(vm.label !== null && { "aria-label": vm.label, role: "timer" })}
    >
      <span
        className={`rest-strip-fill rest-strip-fill--${vm.kind}`}
        style={{ width: `${vm.share * 100}%` }}
      />
      <span className="rest-strip-text">{vm.text}</span>
      {vm.then !== null && <span className="rest-strip-then">{vm.then}</span>}
    </div>
  );
}
