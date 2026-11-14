import type { Entitlements } from "@sendtally/api-client";
import { lapsed } from "./transforms";

const isMember = (entitlements: Entitlements, now: Date): boolean =>
  entitlements.membership.active && !lapsed(entitlements.membership, now);

const trialRunning = (entitlements: Entitlements, now: Date): boolean =>
  Date.parse(entitlements.trial.endsAt) > now.getTime();

/** What every member gate asks: a live membership, or a trial still running. */
export function hasAccess(entitlements: Entitlements | null, now: Date = new Date()): boolean {
  if (entitlements === null) return false;
  return isMember(entitlements, now) || trialRunning(entitlements, now);
}
