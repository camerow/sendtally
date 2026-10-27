import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { todayIn } from "@sendtally/core/hang";
import { queries, useQuery, type QueryState } from "../query";
import {
  overviewVM,
  type ActivityKind,
  type StatisticsOverviewVM,
  type StatisticsRange,
} from "./overview";

export function useStatisticsOverview(
  api: SendtallyApi,
  range: StatisticsRange,
  kinds: readonly ActivityKind[]
): QueryState<StatisticsOverviewVM> {
  const { state } = useQuery(queries.sessionsWithClimbs(api));
  return React.useMemo(
    (): QueryState<StatisticsOverviewVM> =>
      state.status !== "ready"
        ? state
        : { status: "ready", data: overviewVM(state.data, todayIn(), range, kinds) },
    [state, range, kinds]
  );
}
