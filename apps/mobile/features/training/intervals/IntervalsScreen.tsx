import React from "react";
import type { IntervalPhase, Run } from "@sendtally/core/hang";
import { useWeightUnit } from "@sendtally/features/activities";
import { useApi } from "../../../lib/api";
import type { IntervalsRun } from "./intervalsParams";
import { IntervalsDone } from "./IntervalsDone";
import { IntervalsPlayer } from "./IntervalsPlayer";

/** The intervals player, then its done screen once the run finishes or is ended. */
export function IntervalsScreen({
  workout,
  end = false,
}: {
  workout: IntervalsRun;
  end?: boolean;
}): React.ReactElement {
  const unit = useWeightUnit(useApi());
  const [finished, setFinished] = React.useState<Run<IntervalPhase> | null>(null);
  return finished === null ? (
    <IntervalsPlayer workout={workout} unit={unit} end={end} onFinish={setFinished} />
  ) : (
    <IntervalsDone workout={workout} run={finished} />
  );
}
