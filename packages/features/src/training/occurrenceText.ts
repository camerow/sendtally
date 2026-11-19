import { weekday } from "@sendtally/core/hang";
import { weekdayShort } from "../hang/format";
import { formatNumber, t } from "../i18n";
import type { Occurrence } from "./plan";
import { workoutMinutes } from "../workouts/library";
import { blockTag } from "./blockText";

/** "Hangboard · week 2 of 6" in a block, else the label alone. */
export function occurrenceTag(label: string, o: Occurrence): string {
  return o.block === null ? label : (blockTag(label, o.block, o.date) ?? label);
}

/** Where a moved run came from, then the session's length and Target RPE: "60 min · Target RPE 8/10". */
export function occurrenceMeta(o: Occurrence): string {
  const w = o.workout;
  if (w === undefined) return "";
  const minutes = workoutMinutes(w, o.session);
  const length = minutes === null ? "" : t("hang.minutes", { n: minutes });
  const target =
    w.targetRpe === null ? "" : t("common.targetRpe", { n: formatNumber(w.targetRpe) });
  const moved =
    o.movedFrom === null ? "" : t("plan.movedFrom", { day: weekdayShort(weekday(o.movedFrom)) });
  return [moved, length, target].filter((p) => p !== "").join(" · ");
}
