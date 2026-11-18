import {
  isChecklist,
  type Item,
  type SessionItem,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { t } from "../i18n";
import { doseSummary, exerciseName } from "./library";

/** "4 of 5": how much of a checklist is ticked. */
export const checklistLine = (done: number, count: number): string =>
  t("workouts.checklistOf", { done, total: count });

/** "Checklist · 4 of 5", where a review or history row names it. */
export const checklistTitle = (done: number, count: number): string =>
  t("workouts.checklistProgress", { done, total: count });

/**
 * An item's name as the user reads it: a checklist reads as one in their language, whatever it
 * is stored as, and anything else by `name`.
 */
export const itemTitle = (
  item: Pick<SessionItem, "exercise" | "checklist">,
  name: (exercise: string) => string = exerciseName
): string => (isChecklist(item) ? t("workouts.checklist") : name(item.exercise));

/** A run's items as workout items, a checklist kept one, for the exercise picker. */
export const runItems = (items: readonly SessionItem[]): Item[] =>
  items.map(({ exercise, dose, checklist }) => ({
    exercise,
    doses: [dose],
    ...(checklist !== undefined && { checklist }),
  }));

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
