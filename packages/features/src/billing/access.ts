import type { Entitlements } from "@sendtally/api-client";
import { formatDate, t } from "../i18n";
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

/** The wizard's membership moment names the trial's end while it runs (T25 option A), else the panel's own eyebrow. */
export function keepEyebrow(entitlements: Entitlements | null, now: Date = new Date()): string {
  if (entitlements === null || !trialRunning(entitlements, now)) return t("common.membership");
  const date = formatDate(new Date(entitlements.trial.endsAt), { month: "short", day: "numeric" });
  return t("billing.freeTrialEnds", { date });
}
