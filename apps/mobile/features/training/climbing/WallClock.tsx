import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { ClockRow } from "../hold/ClockRow";
import { ClockToggle } from "./ClockToggle";

export type WallClockProps = {
  /** The set's time on the wall. */
  targetS: number;
  left: number;
  running: boolean;
  onToggle: () => void;
};

/**
 * A timed climbing set's clock, under its climbs: only its own button starts and pauses it.
 */
export function WallClock({
  targetS,
  left,
  running,
  onToggle,
}: WallClockProps): React.ReactElement {
  const clock = elapsedClock(targetS - left);
  const of = t("activities.holdOf", { time: elapsedClock(targetS) });
  return (
    <ClockRow
      share={targetS > 0 ? (targetS - left) / targetS : 0}
      accessibilityLabel={`${clock} ${of}`}
      word={null}
      clock={clock}
      of={of}
    >
      <ClockToggle left={left} running={running} onToggle={onToggle} />
    </ClockRow>
  );
}
