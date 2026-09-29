import type { HangHistoryRow } from "@sendtally/api-client";
import { isBuiltInGrip, LIBRARY } from "@sendtally/core/hang";
import { loadLabel } from "../hang/format";
import { builtInGripName, workoutName } from "../hang/names";
import { t } from "../i18n";

/** A hang session has a date and no clock time, so it sits at midday in the log. */
export const hangAt = (row: Pick<HangHistoryRow, "date">): string => `${row.date}T12:00:00Z`;

export function hangTitle(row: Pick<HangHistoryRow, "workoutId" | "protocol">): string {
  const library = LIBRARY.some((w) => w.id === row.workoutId);
  return workoutName({
    id: row.workoutId,
    source: library ? "library" : "mine",
    name: row.protocol.name,
  });
}

export function hangGripLabel(row: Pick<HangHistoryRow, "gripId" | "gripName">): string | null {
  if (row.gripName !== null) return row.gripName;
  return isBuiltInGrip(row.gripId) ? builtInGripName(row.gripId) : null;
}

/** "Hangboard session · Half crimp · +4 kg". Loads read in kg: sendtally has no unit setting. */
export function hangMetaLabel(row: HangHistoryRow): string {
  return [
    t("sessions.hangboardSession"),
    hangGripLabel(row),
    loadLabel(row.protocol.kind, row.loadKg, "kg"),
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

export function hangEffortLabel(row: Pick<HangHistoryRow, "rpe">): string | null {
  return row.rpe === null ? null : `RPE ${row.rpe}`;
}
