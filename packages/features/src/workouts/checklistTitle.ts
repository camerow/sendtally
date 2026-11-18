import { t } from "../i18n";

/** "Checklist · 4 of 5", where a review or history row names it. */
export const checklistTitle = (done: number, count: number): string =>
  t("workouts.checklistProgress", { done, total: count });
