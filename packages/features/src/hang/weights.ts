import { toUnit, type HangKind, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";

/** A weight's number in the user's unit, an assisted one with a true minus: "−20". */
export const weightValue = (kg: number, unit: WeightUnit): string =>
  formatNumber(toUnit(kg, unit)).replace("-", "−");

/** "100 kg", "−20 kg": a weight lifted, or an amount of weight. */
export const weightText = (kg: number, unit: WeightUnit): string =>
  t("hang.loadPlain", { value: weightValue(kg, unit), unit });

/** A hang's added load as a field shows it, its unit beside: "+10", "−5" assisted, "BW" at none. */
export function hangLoadValue(kg: number, unit: WeightUnit): string {
  const value = toUnit(kg, unit);
  if (value === 0) return t("hang.bw");
  return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`;
}

/** A hang's added load: "+10 lb", "−5 lb" assisted, "BW" at none. */
export function hangLoadText(kg: number, unit: WeightUnit): string {
  const value = toUnit(kg, unit);
  if (value === 0) return t("hang.bw");
  const shown = formatNumber(Math.abs(value));
  return t(value > 0 ? "hang.loadPlus" : "hang.loadMinus", { value: shown, unit });
}

/** A hang's added load, "+4 kg" or "BW"; a ground pull's weight, "30 kg". */
export const loadLabel = (kind: HangKind, kg: number, unit: WeightUnit): string =>
  kind === "pull" ? weightText(kg, unit) : hangLoadText(kg, unit);

/** "+2 kg", "−5 lb": a difference in weight, in the user's unit; "Same" when it did not move. */
export function loadChange(kg: number, unit: WeightUnit): string {
  return toUnit(kg, unit) === 0 ? t("summary.same") : hangLoadText(kg, unit);
}
