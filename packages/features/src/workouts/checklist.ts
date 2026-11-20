import { isChecklist, type Item, type SessionItem } from "@sendtally/core/hang";
import { t } from "../i18n";
import { exerciseName } from "./library";

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

/** A workout body's heading: "Exercises", or "In this workout" once a checklist is in it. */
export const bodyHeading = (items: readonly { checklist?: unknown }[]): string =>
  items.some((i) => i.checklist !== undefined)
    ? t("workouts.inThisWorkout")
    : t("workouts.exercises");
