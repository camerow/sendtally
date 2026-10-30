import type { Plan } from "@sendtally/api-client";
import type { Membership, Workout, WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import type { WorkoutLookup } from "@sendtally/features/training";
import { durationLabel } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { bodySummary, workoutMinutes } from "@sendtally/features/workouts";
import { openMembership } from "./openMembership";

export type PlanGridRow = {
  key: string;
  kind: WorkoutKind;
  name: string;
  /** What it holds, a part a line. */
  lines: readonly string[];
  days: readonly number[];
  open: () => void;
};

/** Fingers: its grip and edge, or how many grips. Else what it holds and how long it takes. */
export function workoutLines(w: Workout, gripName: (id: string) => string): string[] {
  if (w.kind === "hangboard") {
    const grips = [...new Set(w.items.map((i) => i.exercise))];
    const [grip] = grips;
    if (grip === undefined) return [kindLabel(w.kind)];
    if (grips.length > 1) return [t("hang.gripCount", { count: grips.length })];
    const edge = w.items[0]?.doses[0]?.edgeMm;
    return [gripName(grip), ...(edge === undefined ? [] : [t("hang.edgeMm", { n: edge })])];
  }
  const minutes = workoutMinutes(w);
  const lines = [bodySummary(w), minutes === null ? null : durationLabel(minutes)];
  const kept = [...new Set(lines.filter((l) => l !== null))];
  return kept.length === 0 ? [kindLabel(w.kind)] : kept;
}

/** One row per membership for the week grid, with what its workout holds and where it opens. */
export function planGridRows(
  members: readonly Membership[],
  workout: WorkoutLookup,
  gripName: (id: string) => string,
  /** What back says on the screen a row opens: the screen the grid is on. */
  back?: string
): PlanGridRow[] {
  return members.flatMap((m): PlanGridRow[] => {
    const w = workout(m.workoutId);
    if (w === undefined) return [];
    return [
      {
        key: m.id,
        kind: w.kind,
        name: w.name,
        lines: workoutLines(w, gripName),
        days: m.weekdays,
        open: () => openMembership(m, back),
      },
    ];
  });
}

/** The memberships still to come: weekly ones, and one-offs from today. */
export const liveMembers = (plan: Plan, today: string): Membership[] =>
  plan.memberships.filter((m) => m.weekdays.length > 0 || m.start >= today);
