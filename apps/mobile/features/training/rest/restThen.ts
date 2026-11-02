import { t } from "@sendtally/features/i18n";
import type { Rest } from "./restCountdown";

/** What a rest is before: the exercise it names, else the set after the one it sits under. */
export const restThen = (rest: Rest): string | null => {
  if (rest.next !== null) return t("activities.restThen", { name: rest.next });
  const set = /^\d+:(\d+)$/.exec(rest.at)?.[1];
  return set === undefined ? null : t("activities.restThenSet", { set: Number(set) + 2 });
};
