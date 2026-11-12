import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import type { SetChange } from "./summary";
import { formatDate, formatNumber, t } from "../i18n";
import type { Stat } from "./types";
import { gradesText } from "../exercises/exerciseText";

/** "+5 lb", "+1 rep", "−10s", or "Same". */
export function changeText({ metric, by }: SetChange, unit: WeightUnit): string {
  if (by === 0) return t("summary.same");
  if (metric === "load") return loadChange(by, unit);
  if (metric === "seconds") return `${by > 0 ? "+" : "−"}${t("hang.seconds", { n: Math.abs(by) })}`;
  if (metric === "averageGrade" || metric === "topGrade")
    return `${by > 0 ? "+" : "−"}${gradesText(by)}`;
  const count = Math.abs(by);
  if (metric === "sends")
    return by > 0 ? t("summary.sentUp", { count }) : t("summary.sentDown", { count });
  if (metric === "laps")
    return by > 0 ? t("summary.lapsUp", { count }) : t("summary.lapsDown", { count });
  return by > 0 ? t("summary.repsUp", { count }) : t("summary.repsDown", { count });
}

/** "+2 kg", "−5 lb": a difference in weight, in the user's unit. */
export function loadChange(kg: number, unit: WeightUnit): string {
  const v = Math.round(toUnit(kg, unit) * 10) / 10;
  if (v === 0) return t("summary.same");
  const value = formatNumber(Math.abs(v));
  return v > 0 ? t("hang.loadPlus", { value, unit }) : t("hang.loadMinus", { value, unit });
}

/** "8:42 pm" on the day it was posted. */
export const postedTime = (iso: string): string =>
  formatDate(new Date(iso), { hour: "numeric", minute: "2-digit" });

/** The effort tile: the effort given, and what the workout aimed for when it says. */
export const effortTile = (rpe: number | null, target: number | null): Stat => ({
  value: rpe === null ? "–" : String(rpe),
  label: target === null ? t("summary.effort") : t("summary.effortAimed", { n: target }),
});
