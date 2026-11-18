import type { SessionItem, WeightUnit, WorkoutKind } from "@sendtally/core/hang";
import { t } from "../i18n";
import { doseSummary, exerciseName } from "./library";

/** "4 of 5": how much of a checklist is ticked. */
export const checklistLine = (done: number, count: number): string =>
  t("workouts.checklistOf", { done, total: count });

/** "Checklist · 4 of 5", where a review or history row names it. */
export const checklistTitle = (done: number, count: number): string =>
  t("workouts.checklistProgress", { done, total: count });

/** An item's name as the user reads it: a checklist reads as one, whatever it is stored as. */
export const itemTitle = (item: Pick<SessionItem, "exercise" | "checklist">): string =>
  item.checklist === undefined ? exerciseName(item.exercise) : t("workouts.checklist");

/** What an item asks for: a checklist its lines, "5 lines", an exercise its dose. */
export const itemDoseText = (
  kind: WorkoutKind,
  item: Pick<SessionItem, "dose" | "checklist">,
  unit: WeightUnit
): string =>
  item.checklist === undefined
    ? doseSummary(kind, item.dose, unit)
    : t("workouts.checklistLines", { count: item.checklist.lines.length });

/** A workout body's heading: "Exercises", or "In this workout" once a checklist is in it. */
export const bodyHeading = (items: readonly { checklist?: unknown }[]): string =>
  items.some((i) => i.checklist !== undefined)
    ? t("workouts.inThisWorkout")
    : t("workouts.exercises");
