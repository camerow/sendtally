import type { Plan } from "@sendtally/api-client";
import type { Membership, Workout, WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import type { WorkoutLookup } from "@sendtally/features/training";
import { durationLabel } from "@sendtally/features/sessions";
import { bodySummary, workoutMinutes } from "@sendtally/features/workouts";
import { openMembership } from "./openMembership";

export type PlanGridRow = {
  key: string;
  kind: WorkoutKind;
  name: string;
  sub: string;
  days: readonly number[];
  open: () => void;
};

const minutesOr = (w: Workout): string => {
  const minutes = workoutMinutes(w);
  return minutes === null ? kindLabel(w.kind) : durationLabel(minutes);
};

/** One row per membership for the week grid, with what its workout holds and where it opens. */
export function planGridRows(
  members: readonly Membership[],
  workout: WorkoutLookup
): PlanGridRow[] {
  return members.flatMap((m): PlanGridRow[] => {
    const w = workout(m.workoutId);
    if (w === undefined) return [];
    return [
      {
        key: m.id,
        kind: w.kind,
        name: w.name,
        sub: bodySummary(w) ?? minutesOr(w),
        days: m.weekdays,
        open: () => openMembership(m),
      },
    ];
  });
}

/** The memberships still to come: weekly ones, and one-offs from today. */
export const liveMembers = (plan: Plan, today: string): Membership[] =>
  plan.memberships.filter((m) => m.weekdays.length > 0 || m.start >= today);
