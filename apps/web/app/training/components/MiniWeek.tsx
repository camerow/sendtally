import React from "react";
import { weekday, type Membership, type WorkoutKind } from "@sendtally/core/hang";
import { daysList } from "@sendtally/features/hang";
import { KIND_LOOK } from "@sendtally/features/training";

export type MiniWeekProps = {
  kind: WorkoutKind;
  m: Pick<Membership, "weekdays" | "start" | "blockId">;
};

/** The seven days a plan lands on, small: its weekdays, or the one day a one-off falls on. */
export function MiniWeek({ kind, m }: MiniWeekProps): React.ReactElement {
  const days: readonly number[] =
    m.weekdays.length > 0 || m.blockId !== null ? m.weekdays : [weekday(m.start)];
  return (
    <span className="mini-week" role="img" aria-label={daysList(days)}>
      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <span
          key={day}
          style={days.includes(day) ? { background: KIND_LOOK[kind].ink } : undefined}
        />
      ))}
    </span>
  );
}
