import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import type { HangGrid } from "./summary";

/** A hang's added load: "+10 lb", "−5 lb" assisted, "BW" at none. */
export function hangLoadText(kg: number, unit: WeightUnit): string {
  const value = toUnit(kg, unit);
  if (value === 0) return t("hang.bw");
  return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))} ${unit}`;
}

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
