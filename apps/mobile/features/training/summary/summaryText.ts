import type { Plan } from "@sendtally/api-client";
import {
  toUnit,
  type CalendarDate,
  type PlanLink,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { kindLabel, type SetChange } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import type { Stat } from "../components/types";

/** "+5 lb", "+1 rep", "−10s", or "Same". */
export function changeText({ metric, by }: SetChange, unit: WeightUnit): string {
  if (by === 0) return t("summary.same");
  if (metric === "load") return loadChange(by, unit);
  if (metric === "seconds") return `${by > 0 ? "+" : "−"}${t("hang.seconds", { n: Math.abs(by) })}`;
  const count = Math.abs(by);
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

/** "Strength · Tue 28 Oct · Week 3 of 6": the kind, the day, and the block week it ran in. */
export function kickerText(
  kind: WorkoutKind,
  date: CalendarDate,
  link: PlanLink,
  plan: Pick<Plan, "blocks" | "memberships">
): string {
  const membership = plan.memberships.find((m) => m.id === link.membershipId);
  const block = plan.blocks.find((b) => b.id === membership?.blockId);
  const week =
    block === undefined || link.week === null
      ? []
      : [t("statistics.blockWeek", { at: link.week, of: block.weeks })];
  return [kindLabel(kind), shortDate(date), ...week].join(" · ");
}

/** The effort tile: the effort given, and what the workout aimed for when it says. */
export const effortTile = (rpe: number | null, target: number | null): Stat => ({
  value: rpe === null ? "–" : String(rpe),
  label: target === null ? t("summary.effort") : t("summary.effortAimed", { n: target }),
});
