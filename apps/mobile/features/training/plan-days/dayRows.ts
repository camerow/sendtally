import { t } from "@sendtally/features/i18n";
import type { DetailMenuRow } from "../components/types";

/**
 * Reschedule and Skip, as a ··· sheet or the day sheet lists them; a missed day leads with Log
 * it, since it can no longer be started.
 */
export const dayRows = (
  open: (kind: "move" | "skip") => void,
  logIt?: () => void
): DetailMenuRow[] => [
  ...(logIt === undefined
    ? []
    : [
        {
          icon: "check" as const,
          title: t("workouts.logIt"),
          hint: t("plan.logItHint"),
          onPress: logIt,
        },
      ]),
  { icon: "today", title: t("plan.move"), hint: t("plan.moveHint"), onPress: () => open("move") },
  { icon: "x", title: t("plan.skip"), hint: t("plan.skipHint"), onPress: () => open("skip") },
];
