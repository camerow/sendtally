import type { WeightUnit } from "@sendtally/core/hang";
import { loadChange } from "../hang/weights";
import type { SetChange } from "./summary";
import { formatDate, formatNumber, t } from "../i18n";
import type { Stat } from "./types";
import { gradesText } from "../exercises/exerciseText";
import { effortWord } from "../hang/names";

/** "+5 lb", "+1 rep", "−10s", or "Same". */
export function changeText({ metric, by }: SetChange, unit: WeightUnit): string {
  if (by === 0) return t("summary.same");
  if (metric === "load") return loadChange(by, unit);
  if (metric === "seconds") return `${by > 0 ? "+" : "−"}${t("hang.seconds", { n: Math.abs(by) })}`;
  if (metric === "averageGrade" || metric === "topGrade")
    return `${by > 0 ? "+" : "−"}${gradesText(by)}`;
  if (metric === "volume") return `${by > 0 ? "+" : "−"}${formatNumber(Math.abs(by))}`;
  const count = Math.abs(by);
  if (metric === "sends")
    return by > 0 ? t("summary.sentUp", { count }) : t("summary.sentDown", { count });
  if (metric === "laps")
    return by > 0 ? t("summary.lapsUp", { count }) : t("summary.lapsDown", { count });
  return by > 0 ? t("summary.repsUp", { count }) : t("summary.repsDown", { count });
}

/** "8:42 pm" on the day it was posted. */
export const postedTime = (iso: string): string =>
  formatDate(new Date(iso), { hour: "numeric", minute: "2-digit" });

/** The RPE tile: "RPE 7" over "Target RPE 8/10", or over the RPE's word with no target. */
export const effortTile = (rpe: number | null, target: number | null): Stat => ({
  value: t("hang.rpeValue", { value: rpe === null ? "–" : formatNumber(rpe) }),
  label:
    target !== null
      ? t("common.targetRpe", { n: formatNumber(target) })
      : rpe === null
        ? t("summary.notRated")
        : effortWord(rpe),
});
