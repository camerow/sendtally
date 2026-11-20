import React from "react";
import { WithWeightUnit } from "../data/WithWeightUnit";
import type { WeightUnit } from "@sendtally/core/hang";
import type { IntervalsRun } from "@sendtally/features/workouts";
import { logRun } from "../data/workoutRunParams";
import { IntervalsPlayer } from "./IntervalsPlayer";

/** The intervals player, which hands what it ran to the review once it finishes or is ended. */
export function IntervalsScreen(props: {
  workout: IntervalsRun;
  end?: boolean;
}): React.ReactElement {
  return (
    <WithWeightUnit>{(unit) => <IntervalsScreenBody {...props} unit={unit} />}</WithWeightUnit>
  );
}

function IntervalsScreenBody({
  unit,
  workout,
  end = false,
}: {
  workout: IntervalsRun;
  end?: boolean;
} & { unit: WeightUnit }): React.ReactElement {
  return (
    <IntervalsPlayer
      workout={workout}
      unit={unit}
      end={end}
      onFinish={(done, off, startedAt) => logRun(workout, done, startedAt, off)}
    />
  );
}
