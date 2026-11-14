import type { Exercise } from "@sendtally/api-client";
import type {
  CalendarDate,
  Grip,
  HangSession,
  WeightUnit,
  Workout,
  WorkoutKind,
} from "@sendtally/core/hang";
import { setText } from "../activities/done";
import { gripMeta } from "../hang/progress";
import { t } from "../i18n";
import {
  exerciseKey,
  exerciseSummary,
  isGradeMetric,
  workoutsUsing,
  type ExerciseSeries,
} from "../statistics/exercises";
import { doseSummary } from "../workouts/library";
import { exerciseLabel } from "./builtIns";
import { metricText } from "./exerciseText";
import { categoryShelves } from "./shelves";
import type { CategoryShelf } from "./types";

/** One exercise on its category's shelf; `meta` is null until it is done. */
export type ShelfCard = {
  key: string;
  kind: WorkoutKind;
  name: string;
  meta: string | null;
  opens: { grip: string } | { exercise: string };
};

export type ShelfWorld = {
  exercises: readonly Exercise[];
  grips: readonly Grip[];
  sessions: readonly HangSession[];
  series: readonly ExerciseSeries[];
  workouts: readonly Workout[];
  today: CalendarDate;
  unit: WeightUnit;
};

function exerciseMeta(name: string, kind: WorkoutKind, w: ShelfWorld): string | null {
  const s = w.series.find((x) => x.key === exerciseKey(name));
  const best = s === undefined ? null : exerciseSummary(s, w.today)?.best;
  if (kind === "climbing") {
    if (s === undefined || best === undefined || best === null) return null;
    const reads = isGradeMetric(s.metric)
      ? t("workouts.exerciseBest", { value: metricText(best.value, s.metric, w.unit, s.grades) })
      : t("common.climbs");
    return `${reads} · ${t("statistics.timesCount", { count: s.sessions.length })}`;
  }
  if (best !== undefined && best !== null)
    return t("workouts.exerciseBest", { value: setText(best.best, w.unit) });
  const using = workoutsUsing(w.workouts, name)[0];
  const dose = using?.items.find((i) => exerciseKey(i.exercise) === exerciseKey(name))?.doses[0];
  return using === undefined || dose === undefined
    ? null
    : t("workouts.exerciseLast", { value: doseSummary(using.kind, dose, w.unit) });
}

/**
 * Train > Exercises: every category, each exercise with its best result or its last dose.
 * Fingers holds the user's own grips and the built-in ones they have hung on.
 */
export function exerciseShelves(w: ShelfWorld): CategoryShelf<ShelfCard>[] {
  const notDone = (meta: string): string | null =>
    meta === t("workouts.notDoneYet") ? null : meta;
  const grips = w.grips
    .filter((g) => !g.hidden)
    .map((g): ShelfCard => ({
      key: g.id,
      kind: "hangboard",
      name: g.name,
      meta: notDone(gripMeta(w.sessions, g.id, w.today, w.unit)),
      opens: { grip: g.id },
    }));
  const mine = w.exercises
    .filter((e) => !e.archived)
    .map((e): ShelfCard => ({
      key: e.id,
      kind: e.kind,
      name: exerciseLabel(e),
      meta: exerciseMeta(e.name, e.kind, w),
      opens: { exercise: e.id },
    }));
  return categoryShelves([...grips, ...mine]);
}

/** A shelf's first rows: done ones first. */
export const shelfRows = <C extends Pick<ShelfCard, "meta">>(
  cards: readonly C[],
  rows: number
): C[] =>
  [...cards].sort((a, b) => Number(a.meta === null) - Number(b.meta === null)).slice(0, rows);
