import type { Activity, ActivityKind } from "@sendtally/api-client";
import type { WorkoutKind } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import { durationLabel } from "../sessions/years";
import { doneSummary } from "./done";

export const ACTIVITY_KINDS = [
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

/** Session RPE: minutes times effort. Null when the effort was not given. */
export function trainingLoad(activity: Pick<Activity, "minutes" | "rpe">): number | null {
  return activity.rpe === null ? null : activity.minutes * activity.rpe;
}

/** Sorts with sessions in the log: at its start time when it has one, else midday. */
export const activityAt = (a: Pick<Activity, "date" | "startTime">): string =>
  `${a.date}T${a.startTime ?? "12:00"}:00Z`;

/** "Strength · 50m", then what was done when anything was: "3 exercises · 9 sets". */
export function activityMetaLabel(a: Pick<Activity, "kind" | "minutes" | "done">): string {
  return [kindLabel(a.kind), durationLabel(a.minutes), doneSummary(a.done)]
    .filter((part) => part !== null)
    .join(" · ");
}

export function activityEffortLabel(a: Pick<Activity, "rpe">): string | null {
  return a.rpe === null ? null : `RPE ${a.rpe}`;
}
