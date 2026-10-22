import type { Activity, ActivityKind, PlanKind } from "@sendtally/api-client";
import { t, type MessageKey } from "../i18n";
import { durationLabel } from "../sessions/years";

export const ACTIVITY_KINDS = [
  "strength",
  "mobility",
  "run",
  "yoga",
  "other",
] as const satisfies readonly ActivityKind[];

export const PLAN_KINDS = ["climb", ...ACTIVITY_KINDS] as const satisfies readonly PlanKind[];

const KIND_LABELS: Record<PlanKind, MessageKey> = {
  climb: "activities.kindClimb",
  strength: "activities.kindStrength",
  mobility: "activities.kindMobility",
  run: "activities.kindRun",
  yoga: "activities.kindYoga",
  other: "activities.kindOther",
};

export function kindLabel(kind: PlanKind): string {
  return t(KIND_LABELS[kind]);
}

/** Sorts with sessions in the log: at its start time when it has one, else midday. */
export const activityAt = (a: Pick<Activity, "date" | "startTime">): string =>
  `${a.date}T${a.startTime ?? "12:00"}:00Z`;

/** "Strength · 50m". */
export function activityMetaLabel(a: Pick<Activity, "kind" | "minutes">): string {
  return `${kindLabel(a.kind)} · ${durationLabel(a.minutes)}`;
}

export function activityEffortLabel(a: Pick<Activity, "rpe">): string | null {
  return a.rpe === null ? null : `RPE ${a.rpe}`;
}
