import type { HangHistoryRow } from "@sendtally/api-client";
import { isBuiltInGrip } from "@sendtally/core/hang";
import { setupLabel } from "../hang/format";
import { builtInGripName } from "../hang/names";
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
  return isBuiltInGrip(row.gripId) ? builtInGripName(row.gripId) : null;
}

/** "Hangboard session · Half crimp · 20 mm · +4 kg". Loads read in kg: sendtally has no unit setting. */
export function hangMetaLabel(row: HangHistoryRow): string {
  return [
    t("sessions.hangboardSession"),
    hangGripLabel(row),
    setupLabel(row.protocol.kind, row, "kg"),
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

export function hangEffortLabel(row: Pick<HangHistoryRow, "rpe">): string | null {
  return row.rpe === null ? null : `RPE ${row.rpe}`;
}
