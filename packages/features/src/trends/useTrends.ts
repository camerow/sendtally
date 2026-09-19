import React from "react";
import type { Gym, SendtallyApi, SessionWithClimbs } from "@sendtally/api-client";
import { queries, useQueryPair, type QueryState } from "../query";
import { daysVM } from "./days";
import { enduranceVM } from "./endurance";
import { trendsVM } from "./overview";
import {
  DEFAULT_TREND_FILTER,
  PREVIEW_TREND_RANGE,
  type DaysVM,
  type EnduranceVM,
  type TrendFilter,
  type TrendRange,
  type TrendsVM,
} from "./types";

export type TrendsOptions = {
  /** Non-member preview: pinned to the last 7 days, every other range reads as locked. */
  preview?: boolean;
};

export type TrendsFeature = {
  state: QueryState<TrendsVM>;
  preview: boolean;
  /** What the charts are drawn from; the range is pinned in a preview. */
  filter: TrendFilter;
  setFilter: (next: (filter: TrendFilter) => TrendFilter) => void;
};

type Data = [SessionWithClimbs[], Gym[]];

function useTrendData(api: SendtallyApi): QueryState<Data> {
  return useQueryPair(queries.sessionsWithClimbs(api), queries.gyms(api)).state;
}

export function useTrends(
  api: SendtallyApi,
  { preview = false }: TrendsOptions = {}
): TrendsFeature {
  const raw = useTrendData(api);
  const [chosen, setChosen] = React.useState<TrendFilter>(DEFAULT_TREND_FILTER);
  const filter = React.useMemo(
    (): TrendFilter => (preview ? { ...chosen, range: PREVIEW_TREND_RANGE } : chosen),
    [chosen, preview]
  );
  const state = React.useMemo(
    (): QueryState<TrendsVM> =>
      raw.status !== "ready"
        ? raw
        : { status: "ready", data: trendsVM(raw.data[0], raw.data[1], filter) },
    [raw, filter]
  );
  const setFilter = React.useCallback(
    (next: (filter: TrendFilter) => TrendFilter): void => setChosen(next),
    []
  );
  return { state, preview, filter, setFilter };
}

export type EnduranceFeature = {
  state: QueryState<EnduranceVM>;
  range: TrendRange;
  setRange: (range: TrendRange) => void;
};

export function useEnduranceTrends(api: SendtallyApi): EnduranceFeature {
  const raw = useTrendData(api);
  const [range, setRange] = React.useState<TrendRange>("1y");
  const state = React.useMemo(
    (): QueryState<EnduranceVM> =>
      raw.status !== "ready" ? raw : { status: "ready", data: enduranceVM(raw.data[0], range) },
    [raw, range]
  );
  return { state, range, setRange };
}

export function useDaysTrends(api: SendtallyApi): QueryState<DaysVM> {
  const raw = useTrendData(api);
  return React.useMemo(
    (): QueryState<DaysVM> =>
      raw.status !== "ready" ? raw : { status: "ready", data: daysVM(raw.data[0], raw.data[1]) },
    [raw]
  );
}
