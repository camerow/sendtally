import React from "react";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { DarkWeek } from "../../../components/DarkWeek";
import { DayMark } from "../../../training/plan-week/DayMark";
import { DarkCard } from "../../components/DarkCard";
import { YoursTag } from "./YoursTag";

export type WorkoutWeek = {
  id: string;
  name: string;
  kind: WorkoutKind | undefined;
  mine: boolean;
  days: readonly Weekday[];
};

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** "Your week" as the control: a row of seven days per workout, each day putting that workout on it or taking it off. */
export function WorkoutWeeks({
  workouts,
  meta,
  dim,
  onToggle,
}: {
  workouts: readonly WorkoutWeek[];
  meta: string;
  dim: readonly Weekday[];
  onToggle: (id: string, day: Weekday) => void;
}): React.ReactElement {
  return (
    <DarkCard
      label={t("plan.week")}
      meta={meta}
      note={t("onboarding.plan.week.empty")}
      noteShown={!workouts.some((w) => w.days.length > 0)}
    >
      {workouts.map((w) => (
        <div key={w.id} className="plan-path-workout">
          <div className="plan-path-workout-head">
            {w.kind !== undefined && <DayMark kind={w.kind} filled onDark />}
            <span className="plan-path-workout-name">{w.name}</span>
            {w.mine && <YoursTag />}
          </div>
          <DarkWeek
            week={WEEKDAYS.map((d) =>
              w.days.includes(d) ? (w.kind === undefined ? [] : [w.kind]) : null
            )}
            dim={dim}
            onToggle={(d) => onToggle(w.id, d)}
          />
        </div>
      ))}
    </DarkCard>
  );
}
