import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";
import { libraryOf } from "../workouts/library";
import { useWorkouts } from "../workouts/useWorkouts";
import type { TrainingLog } from "./days";
import { usePlan } from "./usePlan";

export type TrainingLogQuery = {
  log: TrainingLog;
  /** Everything it reads has loaded; until then what has not is empty. */
  ready: boolean;
};

const EMPTY_PLAN = { blocks: [], memberships: [], weekChanges: [] };

/** The log and the plan as the training screens read them, with every workout to look up. */
export function useTrainingLog(api: SendtallyApi): TrainingLogQuery {
  const { state: sessions } = useQuery(queries.sessions(api));
  const { state: hang } = useQuery(queries.hang(api));
  const { state: plan } = usePlan(api);
  const { state: mine } = useWorkouts(api);
  return React.useMemo((): TrainingLogQuery => {
    const byId = new Map(libraryOf(mine.status === "ready" ? mine.data : []).map((w) => [w.id, w]));
    return {
      log: {
        climbs: sessions.status === "ready" ? sessions.data.sessions : [],
        activities: sessions.status === "ready" ? sessions.data.activities : [],
        hangs: hang.status === "ready" ? hang.data.sessions : [],
        plan: plan.status === "ready" ? plan.data : EMPTY_PLAN,
        workout: (id) => byId.get(id),
      },
      ready: [sessions, hang, plan, mine].every((s) => s.status === "ready"),
    };
  }, [sessions, hang, plan, mine]);
}
