import type { SendtallyApi } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { queries, useQuery } from "../query";

/** The unit the hangboard settings show loads in, kg until they have loaded. */
export function useWeightUnit(api: SendtallyApi): WeightUnit {
  const { state } = useQuery(queries.hang(api));
  return state.status === "ready" ? state.data.settings.units : "kg";
}
