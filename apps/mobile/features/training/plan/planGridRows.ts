import type { Plan } from "@sendtally/api-client";
import type { Membership, Workout, WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import type { WorkoutLookup } from "@sendtally/features/training";
import { durationLabel } from "@sendtally/features/sessions";
import type { HangModel } from "@sendtally/features/hang";
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

/** How grips read: their names, and the grip a one-grip workout was set to. */
export type GripNames = Pick<HangModel, "gripName" | "defaultGrip" | "workout">;

/** Fingers: its grip and edge, or how many grips. Else what it holds and how long it takes. */
export function workoutLines(w: Workout, grips: GripNames): string[] {
  if (w.kind === "hangboard") {
    const used = [...new Set(w.items.map((i) => i.exercise))];
    const [grip] = used;
    if (grip === undefined) return [kindLabel(w.kind)];
    if (used.length > 1) return [t("hang.gripCount", { count: used.length })];
    const edges = new Set(w.items.flatMap((i) => i.doses.map((d) => d.edgeMm ?? 0)));
    const [edge] = edges;
    const one = edges.size === 1 && edge ? [t("hang.edgeMm", { n: edge })] : [];
    const hang = grips.workout(w.id);
    return [grips.gripName(hang === undefined ? grip : grips.defaultGrip(hang)), ...one];
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
  grips: GripNames,
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
        lines: workoutLines(w, grips),
        days: m.weekdays,
        open: () => openMembership(m, back),
      },
    ];
  });
}

/** The memberships still to come: weekly ones, and one-offs from today. */
export const liveMembers = (plan: Plan, today: string): Membership[] =>
  plan.memberships.filter((m) => m.weekdays.length > 0 || m.start >= today);
