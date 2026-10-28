import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import type { TrendRange } from "../trends/types";
import { trainingInsightsVM, type TrainingInsightsVM } from "./insights";
import type { ActivityKind } from "./overview";

export function useTrainingInsights(
  api: SendtallyApi,
  range: TrendRange,
  kinds: readonly ActivityKind[],
  gripName: (id: string) => string
): QueryState<TrainingInsightsVM> {
  const { state } = useQuery(queries.sessionsWithClimbs(api));
  return React.useMemo(
    (): QueryState<TrainingInsightsVM> =>
      state.status !== "ready"
        ? state
        : { status: "ready", data: trainingInsightsVM(state.data, range, kinds, gripName) },
    [state, range, kinds, gripName]
  );
}
