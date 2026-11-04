import { letterOf, turnsOf, weekday, type WeightUnit } from "@sendtally/core/hang";
import { weekdayShort } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { kindLabel } from "@sendtally/features/activities";
import type { Occurrence } from "@sendtally/features/training";
import { doseSummary } from "@sendtally/features/workouts";
import { blockTag } from "../blocks/blockText";

/** "Hangboard · week 2 of 6" in a block, else the label alone. */
export function occurrenceTag(label: string, o: Occurrence): string {
  return o.block === null ? label : (blockTag(label, o.block, o.date) ?? label);
}

/** A kicker that wraps only between its " · " segments, never inside one. */
export const unbrokenSegments = (text: string): string =>
  text
    .split(" · ")
    .map((s) => s.replace(/ /g, "\u00A0"))
    .join(" · ");

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
