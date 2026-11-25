import type { Entitlements } from "@sendtally/api-client";
import { formatDate, t } from "../i18n";
import { lapsed } from "./transforms";

export const isMember = (entitlements: Entitlements, now: Date): boolean =>
  entitlements.membership.active && !lapsed(entitlements.membership, now);

export const trialRunning = (entitlements: Entitlements, now: Date): boolean =>
  Date.parse(entitlements.trial.endsAt) > now.getTime();

/** What every member gate asks: a live membership, or a trial still running. */
export function hasAccess(entitlements: Entitlements | null, now: Date = new Date()): boolean {
  if (entitlements === null) return false;
  return isMember(entitlements, now) || trialRunning(entitlements, now);
}

export function keepEyebrow(entitlements: Entitlements | null, now: Date = new Date()): string {
  if (entitlements === null || !trialRunning(entitlements, now)) return t("common.membership");
  const date = formatDate(new Date(entitlements.trial.endsAt), { month: "short", day: "numeric" });
  return t("billing.freeTrialEnds", { date });
}
