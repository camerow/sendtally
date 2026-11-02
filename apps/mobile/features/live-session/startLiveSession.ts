import { router } from "expo-router";
import type { PlanLink } from "@sendtally/core/hang";
import { planLinkParams } from "../training/data/planLinkParams";
import { startLive } from "./startLive";

/**
 * Starts a new live session, linked to the plan and named after the workout when given, once
 * whatever already runs is dealt with.
 */
export function startLiveSession(link?: PlanLink, name?: string): void {
  startLive(() =>
    router.push({
      pathname: "/session/live",
      params: {
        ...(link === undefined ? {} : planLinkParams(link)),
        ...(name === undefined ? {} : { name }),
      },
    })
  );
}
