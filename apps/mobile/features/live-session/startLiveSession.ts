import { router } from "expo-router";
import type { PlanLink } from "@sendtally/core/hang";
import { planLinkParams } from "../training/data/planLinkParams";

/** Opens the live tally: the session already running, or a new one, linked to the plan when given. */
export function startLiveSession(link?: PlanLink): void {
  router.push({
    pathname: "/session/live",
    params: link === undefined ? {} : planLinkParams(link),
  });
}
