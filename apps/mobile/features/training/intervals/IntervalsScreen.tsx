import React from "react";
import { useWeightUnit } from "@sendtally/features/activities";
import type { IntervalsRun } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { logRun } from "../data/workoutRunParams";
import { IntervalsPlayer } from "./IntervalsPlayer";

/** The intervals player, which hands what it ran to the review once it finishes or is ended. */
export function IntervalsScreen({
  workout,
  end = false,
}: {
  workout: IntervalsRun;
  end?: boolean;
}): React.ReactElement {
  const unit = useWeightUnit(useApi());
  return (
    <IntervalsPlayer
      workout={workout}
      unit={unit}
      end={end}
      onFinish={(done, off, startedAt) => logRun(workout, done, startedAt, off)}
    />
  );
}
