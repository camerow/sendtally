import type { Activity, ActivityKind } from "@sendtally/api-client";
import type { WorkoutKind } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import { durationLabel } from "../sessions/years";

export const ACTIVITY_KINDS = [
  "climbing",
  "strength",
  "mobility",
  "other",
] as const satisfies readonly ActivityKind[];

const KIND_LABELS: Record<WorkoutKind, MessageKey> = {
  hangboard: "activities.kindFingers",
  climbing: "activities.kindClimb",
  strength: "activities.kindStrength",
  mobility: "activities.kindMobility",
  other: "activities.kindOther",
};

export function kindLabel(kind: WorkoutKind): string {
  return t(KIND_LABELS[kind]);
}

/** Sorts with sessions in the log: at its start time when it has one, else midday. */
export const activityAt = (a: Pick<Activity, "date" | "startTime">): string =>
  `${a.date}T${a.startTime ?? "12:00"}:00Z`;

/** "Strength · 50m": its kind and the time it took. */
export function activityMetaLabel(a: Pick<Activity, "kind" | "minutes">): string {
  return [kindLabel(a.kind), durationLabel(a.minutes)].join(" · ");
}

export function activityEffortLabel(a: Pick<Activity, "rpe">): string | null {
  return a.rpe === null ? null : `RPE ${a.rpe}`;
}
