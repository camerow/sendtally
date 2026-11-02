import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "@sendtally/features/i18n";

/** A hang's added load: "+10 lb", "−5 lb" assisted, "BW" at none. */
export function loadText(kg: number, unit: WeightUnit): string {
  const value = toUnit(kg, unit);
  if (value === 0) return t("hang.bw");
  return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))} ${unit}`;
}
