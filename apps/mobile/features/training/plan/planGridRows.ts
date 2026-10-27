import type { Plan } from "@sendtally/api-client";
import type { Membership, WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import type { WorkoutLookup } from "@sendtally/features/training";
import { bodySummary } from "@sendtally/features/workouts";
import { openMembership } from "./openMembership";

export type PlanGridRow = {
  key: string;
  kind: WorkoutKind;
  name: string;
  sub: string;
  days: readonly number[];
  open: () => void;
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
        sub: bodySummary(w) ?? kindLabel(w.kind),
        days: m.weekdays,
        open: () => openMembership(m),
      },
    ];
  });
}

/** The memberships still to come: weekly ones, and one-offs from today. */
export const liveMembers = (plan: Plan, today: string): Membership[] =>
  plan.memberships.filter((m) => m.weekdays.length > 0 || m.start >= today);
