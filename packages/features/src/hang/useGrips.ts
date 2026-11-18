import type { SendtallyApi } from "@sendtally/api-client";
import { isBuiltInGrip } from "@sendtally/core/hang";
import { queries, useQuery } from "../query";
import { gripName } from "./names";

export type GripsKnown = {
  /** Whether a workout item names a grip: a built-in one, or one of the user's own once loaded. */
  isGrip: (exercise: string) => boolean;
  gripName: (id: string) => string;
};

/** The grips a workout's items can name, from the hangboard data, for screens outside its provider. */
export function useGrips(api: SendtallyApi): GripsKnown {
  const { state } = useQuery(queries.hang(api));
  const grips = state.status === "ready" ? state.data.grips : [];
  return {
    isGrip: (exercise) => isBuiltInGrip(exercise) || grips.some((g) => g.id === exercise),
    gripName: (id) => gripName(id, grips),
  };
}
