import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { usePlan } from "../training/usePlan";
import { seededPath, setPlanPath, usePlanPath, type PlanPath } from "./planPath";

/** The walk, seeded once from the saved plan as it loads; not ready until then. */
export function useSeededPlanPath(api: SendtallyApi): PlanPath {
  const current = usePlanPath();
  const plan = usePlan(api).state;
  React.useEffect(() => {
    if (plan.status === "ready") setPlanPath((p) => seededPath(p, plan.data));
  }, [plan]);
  return current;
}
