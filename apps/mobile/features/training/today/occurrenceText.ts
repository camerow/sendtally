import type { WeightUnit } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import type { Occurrence } from "@sendtally/features/training";
import { doseSummary } from "@sendtally/features/workouts";
import { blockTag } from "../blocks/blockText";

/** "Hangboard · week 2 of 6" in a block, else the label alone. */
export function occurrenceTag(label: string, o: Occurrence): string {
  return o.block === null ? label : (blockTag(label, o.block, o.date) ?? label);
}

/** The variation it takes when the workout rotates, then what its first item asks for. */
export function occurrenceMeta(o: Occurrence, unit: WeightUnit): string {
  const w = o.workout;
  if (w === undefined) return "";
  const label = w.variations.length > 1 ? (w.variations[o.variation]?.label ?? "") : "";
  const [first] = o.items;
  const dose = first === undefined ? kindLabel(w.kind) : doseSummary(w.kind, first.dose, unit);
  return [label, dose].filter((p) => p !== "").join(" · ");
}
