import React from "react";
import type { WeightUnit } from "@sendtally/core/hang";
import { queries, useQuery } from "@sendtally/features/query";
import { useApi } from "../../../lib/api";
import { LoadState } from "./LoadState";

/** Renders `children` once the user's weight unit is known, so no weight shows or saves in the wrong unit. */
export function WithWeightUnit({
  children,
}: {
  children: (unit: WeightUnit) => React.ReactNode;
}): React.ReactElement {
  const { state, reload } = useQuery(queries.hang(useApi()));
  return state.status === "ready" ? (
    <>{children(state.data.settings.units)}</>
  ) : (
    <LoadState state={state} onRetry={() => void reload()} framed />
  );
}
