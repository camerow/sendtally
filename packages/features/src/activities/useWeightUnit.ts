import type { SendtallyApi } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { queries, useQuery } from "../query";

/** The unit the user reads weights in; null until it has loaded, so nothing shows or saves in a guessed one. */
export function useWeightUnit(api: SendtallyApi): WeightUnit | null {
  const { state } = useQuery(queries.hang(api));
  return state.status === "ready" ? state.data.settings.units : null;
}
