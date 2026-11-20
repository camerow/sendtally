import type { HangHistoryRow } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { isBuiltInGrip } from "@sendtally/core/hang";
import { setupLabel } from "../hang/format";
import { builtInGripLabel } from "../hang/names";
import { t } from "../i18n";
import { builtInWorkouts } from "../workouts/builtIns";

/** A hang session has a date and no clock time, so it sits at midday in the log. */
export const hangAt = (row: Pick<HangHistoryRow, "date">): string => `${row.date}T12:00:00Z`;

/** A built-in's name in the user's language, else the name the session ran under. */
export function hangTitle(row: Pick<HangHistoryRow, "workoutId" | "protocol">): string {
  return builtInWorkouts().find((w) => w.id === row.workoutId)?.name ?? row.protocol.name;
}

export function hangGripLabel(row: Pick<HangHistoryRow, "gripId" | "gripName">): string | null {
  if (row.gripName !== null) return row.gripName;
  return isBuiltInGrip(row.gripId) ? builtInGripLabel(row.gripId) : null;
}

/** "Hangboard session · Half crimp · 20 mm · +4 kg", the load in the user's unit, left off until it is known. */
export function hangMetaLabel(row: HangHistoryRow, unit: WeightUnit | null): string {
  return [
    t("sessions.hangboardSession"),
    hangGripLabel(row),
    unit === null ? null : setupLabel(row.protocol.kind, row, unit),
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

export function hangEffortLabel(row: Pick<HangHistoryRow, "rpe">): string | null {
  return row.rpe === null ? null : `RPE ${row.rpe}`;
}
