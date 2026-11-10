import { t } from "@sendtally/features/i18n";
import type { Membership } from "@sendtally/core/hang";
import type { DetailMenuRow } from "../components/types";

/**
 * Reschedule and Skip, as a ··· sheet or the day sheet lists them; a missed day leads with Log
 * it, since it can no longer be started. A one-off can also be removed, last.
 */
export const dayRows = (
  open: (kind: "move" | "skip") => void,
  logIt?: () => void,
  remove?: () => void
): DetailMenuRow[] => [
  ...(logIt === undefined
    ? []
    : [
        {
          icon: "check" as const,
          title: t("workouts.logIt"),
          onPress: logIt,
        },
      ]),
  { icon: "today", title: t("plan.move"), onPress: () => open("move") },
  { icon: "x", title: t("plan.skip"), onPress: () => open("skip") },
  ...(remove === undefined
    ? []
    : [
        {
          icon: "trash" as const,
          title: t("plan.removeAction"),
          onPress: remove,
          danger: true,
        },
      ]),
];

/** A one-off, the only plan Remove takes away whole: a repeat or a block day is skipped instead. */
export const isOneOff = (m: Membership): boolean => m.blockId === null && m.weekdays.length === 0;
