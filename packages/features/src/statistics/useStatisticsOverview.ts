import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { todayIn } from "@sendtally/core/hang";
import { queries, useQuery, type QueryState } from "../query";
import { overviewVM, type StatisticsOverviewVM } from "./overview";

export function useStatisticsOverview(api: SendtallyApi): QueryState<StatisticsOverviewVM> {
  const { state } = useQuery(queries.sessions(api));
  return React.useMemo(
    (): QueryState<StatisticsOverviewVM> =>
      state.status !== "ready"
        ? state
        : { status: "ready", data: overviewVM(state.data, todayIn()) },
    [state]
  );
}
