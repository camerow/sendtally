import type { ActivityRecord, HangSessionRecord } from "@sendtally/api-client";
import type { CalendarDate, WeightUnit } from "@sendtally/core/hang";
import { climbsLine, isClimbingSets, wallLine } from "./climbing";
import { checklistsLine, setText } from "./done";
import { bestSet, hangGrids, hangTotals } from "./summary";
import { dayMonth, loadLabel } from "../hang/format";
import type { HangModel } from "../hang/model";
import { t } from "../i18n";
import { exerciseKey, type ExerciseSeries } from "../statistics";
import type { HistoryItem } from "./types";

/** A workout's sessions, newest first. */
export function ofWorkout<T extends { workoutId: string | null; date: CalendarDate }>(
  all: readonly T[],
  workoutId: string
): T[] {
  return all.filter((s) => s.workoutId === workoutId).sort((a, b) => b.date.localeCompare(a.date));
}

const named = (name: string, current: boolean): string =>
  current ? t("summary.thisSession", { name }) : name;

/** A finished workout: its first exercise's best set, how long it took, and its checklist ticked. */
export function activityItem(a: ActivityRecord, unit: WeightUnit, currentId?: string): HistoryItem {
  const first = a.done.find((d) => d.sets.length > 0);
  const best = first === undefined ? undefined : bestSet(first.sets);
  const lead =
    first === undefined || best === undefined ? [] : [`${first.exercise} ${setText(best, unit)}`];
  const current = a.id === currentId;
  return {
    id: a.id,
    date: dayMonth(a.date),
    name: named(a.title, current),
    meta: [...lead, t("hang.minutes", { n: a.minutes }), checklistsLine(a.done)]
      .filter((p) => p !== null)
      .join(" · "),
    rpe: a.rpe,
    current,
  };
}

/**
 * A hangboard session: the grip, the load on it and how many hangs held. One that ran several
 * grips names them all and leaves the load off, each grip having its own.
 */
export function hangItem(
  s: HangSessionRecord,
  model: Pick<HangModel, "gripName" | "settings">,
  currentId?: string
): HistoryItem {
  const grips = hangGrids(s).map((g) => model.gripName(g.gripId));
  const totals = hangTotals(s);
  const current = s.id === currentId;
  const load = grips.length > 1 ? [] : [loadLabel(s.protocol.kind, s.loadKg, model.settings.units)];
  return {
    id: s.id,
    date: dayMonth(s.date),
    name: named(grips.join(", "), current),
    meta: [...load, t("summary.hangsOf", { held: totals.held, total: totals.total })].join(" · "),
    rpe: s.rpe,
    current,
  };
}

/** What a session did of one exercise: climbs over all its sets, else its best set. */
function exerciseMeta(
  activity: ActivityRecord | undefined,
  series: ExerciseSeries,
  best: ExerciseSeries["sessions"][number]["best"],
  unit: WeightUnit
): string {
  const sets = (activity?.done ?? [])
    .filter((d) => exerciseKey(d.exercise) === series.key)
    .flatMap((d) => d.sets);
  if (!isClimbingSets(sets)) return setText(best, unit);
  return sets.some((s) => s.onS !== undefined) ? wallLine(sets) : climbsLine(sets);
}

/** An exercise's sessions, newest first: the workout it was in and what it did there. */
export function exerciseItems(
  series: ExerciseSeries,
  activities: readonly ActivityRecord[],
  unit: WeightUnit
): HistoryItem[] {
  return [...series.sessions].reverse().map((s) => {
    const activity = activities.find((a) => a.id === s.activityId);
    return {
      id: s.activityId,
      date: dayMonth(s.date),
      name: activity?.title ?? series.name,
      meta: exerciseMeta(activity, series, s.best, unit),
      rpe: activity?.rpe ?? null,
    };
  });
}
