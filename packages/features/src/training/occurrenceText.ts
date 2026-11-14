import { letterOf, turnsOf, weekday, type WeightUnit } from "@sendtally/core/hang";
import { weekdayShort } from "../hang/format";
import { t } from "../i18n";
import { kindLabel } from "../activities/format";
import type { Occurrence } from "./plan";
import { doseSummary } from "../workouts/library";
import { blockTag } from "./blockText";

/** "Hangboard · week 2 of 6" in a block, else the label alone. */
export function occurrenceTag(label: string, o: Occurrence): string {
  return o.block === null ? label : (blockTag(label, o.block, o.date) ?? label);
}

/** Where a moved run came from, then the session's letter when the workout alternates, then what its first item asks for. */
export function occurrenceMeta(o: Occurrence, unit: WeightUnit): string {
  const w = o.workout;
  if (w === undefined) return "";
  const turns = turnsOf(w.items);
  const label = turns > 1 ? letterOf(o.session % turns) : "";
  const [first] = o.items;
  const dose = first === undefined ? kindLabel(w.kind) : doseSummary(w.kind, first.dose, unit);
  const moved =
    o.movedFrom === null ? "" : t("plan.movedFrom", { day: weekdayShort(weekday(o.movedFrom)) });
  return [moved, label, dose].filter((p) => p !== "").join(" · ");
}
