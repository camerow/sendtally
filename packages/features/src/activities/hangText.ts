import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import type { HangGrid } from "./summary";

/** A hang's added load as a set's load field shows it, its unit beside: "+10", "−5" assisted, "BW" at none. */
export function hangLoadValue(kg: number, unit: WeightUnit): string {
  const value = toUnit(kg, unit);
  if (value === 0) return t("hang.bw");
  return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`;
}

/** A hang's added load: "+10 lb", "−5 lb" assisted, "BW" at none. */
export const hangLoadText = (kg: number, unit: WeightUnit): string =>
  toUnit(kg, unit) === 0 ? t("hang.bw") : `${hangLoadValue(kg, unit)} ${unit}`;

/** "33 of 36 hangs · top load +10 lb", the load left off when every set hung bodyweight. */
export function hangCount({ held, total, loads }: HangGrid, unit: WeightUnit): string {
  const top = Math.max(...loads);
  return [
    t("summary.hangsOf", { held, total }),
    ...(loads.every((l) => l === 0)
      ? []
      : [t("summary.topLoad", { load: hangLoadText(top, unit) })]),
  ].join(" · ");
}
