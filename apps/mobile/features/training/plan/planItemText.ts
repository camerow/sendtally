import type { PlanItem, PlanKind } from "@sendtally/api-client";
import { kindLabel } from "@sendtally/features/activities";
import { daysList, planRange } from "@sendtally/features/hang";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";

const DEFAULT_TITLES: Record<PlanKind, MessageKey> = {
  climb: "plan.titleClimb",
  strength: "plan.titleStrength",
  mobility: "plan.titleMobility",
  run: "plan.titleRun",
  yoga: "plan.titleYoga",
  other: "plan.titleOther",
};

export function defaultTitle(kind: PlanKind): string {
  return t(DEFAULT_TITLES[kind]);
}

/** "Tue, Thu" or "3 a week". */
export function scheduleText(item: Pick<PlanItem, "days" | "perWeek">): string {
  return item.perWeek === null ? daysList(item.days) : t("plan.perWeek", { count: item.perWeek });
}

/** "Strength · 1h · Target effort 7", leaving out what was not set. */
export function planItemMeta(item: Pick<PlanItem, "kind" | "minutes" | "targetRpe">): string {
  return [
    kindLabel(item.kind),
    ...(item.minutes === null ? [] : [durationLabel(item.minutes)]),
    ...(item.targetRpe === null ? [] : [t("plan.targetValue", { n: item.targetRpe })]),
  ].join(" · ");
}

/** "Tue, Thu · from 5 Oct". */
export function planItemWhen(item: Pick<PlanItem, "days" | "perWeek" | "start" | "end">): string {
  return `${scheduleText(item)} · ${planRange(item)}`;
}
