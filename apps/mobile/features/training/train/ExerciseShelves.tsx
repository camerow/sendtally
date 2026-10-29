import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { byDate, summarise, type HangSession, type WorkoutKind } from "@sendtally/core/hang";
import { setText, useWeightUnit } from "@sendtally/features/activities";
import { categoryShelves, exerciseLabel } from "@sendtally/features/exercises";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  exerciseSummary,
  isGradeMetric,
  useExerciseSeries,
  useExercises,
  workoutsUsing,
} from "@sendtally/features/statistics";
import { doseSummary } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { metricText } from "../exercises/exerciseText";
import { openExerciseEditor } from "../exercises/openExerciseEditor";
import { useLibrary } from "../library/useLibrary";
import { ExerciseShelf } from "./ExerciseShelf";
import type { ShelfCard } from "./types";

/**
 * Train > Exercises: every category, each exercise with its best result or its last dose.
 * Fingers holds the user's own grips and the built-in ones they have hung on. A plus makes
 * one in its category, See all opens the category whole.
 */
export function ExerciseShelves(): React.ReactElement {
  const api = useApi();
  const { model, today } = useHangData();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;

  const workouts = library.status === "ready" ? library.data.workouts : [];
  const logged = series.status === "ready" ? series.data : [];
  const metaOf = (name: string, kind: WorkoutKind): string => {
    const s = logged.find((x) => x.key === exerciseKey(name));
    const best = s === undefined ? null : exerciseSummary(s, today)?.best;
    if (kind === "climbing") {
      if (s === undefined || best === undefined || best === null) return t("workouts.notDoneYet");
      const reads = isGradeMetric(s.metric)
        ? t("workouts.exerciseBest", { value: metricText(best.value, s.metric, unit, s.grades) })
        : t("common.climbs");
      return `${reads} · ${t("statistics.timesCount", { count: s.sessions.length })}`;
    }
    if (best !== undefined && best !== null)
      return t("workouts.exerciseBest", { value: setText(best.best, unit) });
    const using = workoutsUsing(workouts, name)[0];
    const dose = using?.items.find((i) => exerciseKey(i.exercise) === exerciseKey(name))?.doses[0];
    return using === undefined || dose === undefined
      ? ""
      : t("workouts.exerciseLast", { value: doseSummary(using.kind, dose, unit) });
  };

  const gripMeta = (onGrip: readonly HangSession[], best: number | null): string => {
    const top =
      (best === null ? undefined : onGrip.findLast((s) => s.pct >= 100 && s.loadKg === best)) ??
      onGrip.at(-1);
    if (top === undefined) return "";
    const kind = top.protocol.kind;
    const kg = best ?? top.loadKg;
    const value = loadLabel(kind, kg, model.settings.units);
    const load =
      kind !== "pull" && kg === 0
        ? t(best === null ? "workouts.exerciseLastBodyweight" : "workouts.exerciseBestBodyweight")
        : t(best === null ? "workouts.exerciseLast" : "workouts.exerciseBest", { value });
    return kind === "pull" ? load : `${load} · ${t("hang.edgeMm", { n: top.edgeMm })}`;
  };
  const grips = model.grips
    .filter((g) => !g.hidden)
    .map((g): ShelfCard => {
      const onGrip = model.sessions.filter((s) => s.gripId === g.id).sort(byDate);
      const summary = summarise(onGrip, today);
      return {
        key: g.id,
        kind: "hangboard",
        name: g.name,
        meta: summary === null ? t("workouts.notDoneYet") : gripMeta(onGrip, summary.best),
        open: () => router.push({ pathname: "/grip/[id]", params: { id: g.id } }),
      };
    });
  const mine = exercises.state.data
    .filter((e) => !e.archived)
    .map((e): ShelfCard => ({
      key: e.id,
      kind: e.kind,
      name: exerciseLabel(e),
      meta: metaOf(e.name, e.kind),
      open: () => router.push({ pathname: "/exercise/[id]", params: { id: e.id } }),
    }));

  return (
    <View style={{ gap: 20 }}>
      {categoryShelves([...grips, ...mine]).map((s) => (
        <ExerciseShelf
          key={s.kind}
          kind={s.kind}
          cards={s.entries}
          onAdd={() => openExerciseEditor(s.kind)}
          onSeeAll={() => router.push({ pathname: "/exercise/category", params: { kind: s.kind } })}
        />
      ))}
    </View>
  );
}
