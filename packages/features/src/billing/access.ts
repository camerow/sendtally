import type { Entitlements } from "@sendtally/api-client";
import { lapsed } from "./transforms";

const DAY_MS = 24 * 60 * 60 * 1000;

const isMember = (entitlements: Entitlements, now: Date): boolean =>
  entitlements.membership.active && !lapsed(entitlements.membership, now);

const trialRunning = (entitlements: Entitlements, now: Date): boolean =>
  Date.parse(entitlements.trial.endsAt) > now.getTime();

/** What every member gate asks: a live membership, or a trial still running. */
export function hasAccess(entitlements: Entitlements | null, now: Date = new Date()): boolean {
  if (entitlements === null) return false;
  return isMember(entitlements, now) || trialRunning(entitlements, now);
}

/** Whole days left in a non-member's trial, a part day counting as one; null once over or for members. */
export function trialDaysLeft(
  entitlements: Entitlements | null,
  now: Date = new Date()
): number | null {
  if (entitlements === null || isMember(entitlements, now) || !trialRunning(entitlements, now)) {
    return null;
  }
  return Math.ceil((Date.parse(entitlements.trial.endsAt) - now.getTime()) / DAY_MS);
}
