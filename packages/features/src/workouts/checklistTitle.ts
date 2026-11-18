import { t } from "../i18n";

export const checklistTitle = (done: number, count: number): string =>
  t("workouts.checklistProgress", { done, total: count });
