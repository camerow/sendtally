import type { ActivityRecord, HangSessionRecord } from "@sendtally/api-client";
import type { CalendarDate, WeightUnit } from "@sendtally/core/hang";
import { bestSet, hangGrid, setText } from "@sendtally/features/activities";
import { dayMonth, loadLabel, type HangModel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { ExerciseSeries } from "@sendtally/features/statistics";
import type { HistoryItem } from "./types";

/** A workout's sessions, newest first. */
export function ofWorkout<T extends { workoutId: string | null; date: CalendarDate }>(
  all: readonly T[],
  workoutId: string
): T[] {
  return all.filter((s) => s.workoutId === workoutId).sort((a, b) => b.date.localeCompare(a.date));
}

const named = (name: string, current: boolean): string =>
  current ? t("summary.thisSession") : name;

/** A finished workout: its first exercise's best set and how long it took. */
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
    meta: [...lead, t("hang.minutes", { n: a.minutes })].join(" · "),
    rpe: a.rpe,
    current,
  };
}

/** A hangboard session: the grip, the load on it and how many hangs held. */
export function hangItem(s: HangSessionRecord, model: HangModel, currentId?: string): HistoryItem {
  const grid = hangGrid(s);
  const current = s.id === currentId;
  return {
    id: s.id,
    date: dayMonth(s.date),
    name: named(model.gripName(s.gripId), current),
    meta: [
      loadLabel(s.protocol.kind, s.loadKg, model.settings.units),
      t("summary.hangsOf", { held: grid.held, total: grid.total }),
    ].join(" · "),
    rpe: s.rpe,
    current,
  };
}

/** An exercise's sessions, newest first: the workout it was in and its best set. */
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
      meta: setText(s.best, unit),
      rpe: activity?.rpe ?? null,
    };
  });
}
