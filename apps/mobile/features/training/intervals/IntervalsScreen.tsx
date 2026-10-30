import React from "react";
import { stepsDone, type IntervalPhase, type Run } from "@sendtally/core/hang";
import { doneOfRun, useWeightUnit } from "@sendtally/features/activities";
import { useApi } from "../../../lib/api";
import { logRun } from "../data/workoutRunParams";
import type { IntervalsRun } from "./intervalsParams";
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
  const sent = React.useRef(false);
  const finish = React.useCallback(
    (run: Run<IntervalPhase>) => {
      if (sent.current) return;
      sent.current = true;
      const { done, off } = doneOfRun(workout.body, stepsDone(run));
      logRun(workout, done, run.startedAt, off);
    },
    [workout]
  );
  return <IntervalsPlayer workout={workout} unit={unit} end={end} onFinish={finish} />;
}
