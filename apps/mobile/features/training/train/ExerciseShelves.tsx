import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { byDate, summarise, type WorkoutKind } from "@sendtally/core/hang";
import { setText, useWeightUnit } from "@sendtally/features/activities";
import { categoryShelves } from "@sendtally/features/exercises";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  exerciseSummary,
  useExerciseSeries,
  useExercises,
  workoutsUsing,
} from "@sendtally/features/statistics";
import { doseSummary } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { ExerciseShelf } from "./ExerciseShelf";
import type { ShelfCard } from "./types";

export type ExerciseShelvesProps = { onAdd: (kind: WorkoutKind) => void };

/**
 * Train > Exercises: every category, each exercise with its best result or its last dose.
 * Fingers holds the user's own grips and the built-in ones they have hung on.
 */
export function ExerciseShelves({ onAdd }: ExerciseShelvesProps): React.ReactElement {
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
  const metaOf = (name: string): string => {
    const s = logged.find((x) => x.key === exerciseKey(name));
    const best = s === undefined ? null : exerciseSummary(s, today)?.best;
    if (best !== undefined && best !== null)
      return t("workouts.exerciseBest", { value: setText(best.best, unit) });
    const using = workoutsUsing(workouts, name)[0];
    const dose = using?.items.find((i) => exerciseKey(i.exercise) === exerciseKey(name))?.doses[0];
    return using === undefined || dose === undefined
      ? ""
      : t("workouts.exerciseLast", { value: doseSummary(using.kind, dose, unit) });
  };

  const grips = model.grips
    .filter((g) => !g.hidden && (g.custom || model.sessions.some((s) => s.gripId === g.id)))
    .map((g): ShelfCard => {
      const onGrip = model.sessions.filter((s) => s.gripId === g.id).sort(byDate);
      const last = onGrip.at(-1);
      const summary = summarise(onGrip, today);
      return {
        key: g.id,
        kind: "hangboard",
        name: g.name,
        meta:
          summary === null || last === undefined
            ? ""
            : t("workouts.exerciseBest", {
                value: loadLabel(last.protocol.kind, summary.best, model.settings.units),
              }),
        open:
          last === undefined
            ? undefined
            : () =>
                router.push({
                  pathname: "/workout/[id]",
                  params: { id: last.workoutId, grip: g.id },
                }),
      };
    });
  const mine = exercises.state.data
    .filter((e) => !e.archived)
    .map((e): ShelfCard => ({
      key: e.id,
      kind: e.kind,
      name: e.name,
      meta: metaOf(e.name),
      open: () => router.push({ pathname: "/exercise/[id]", params: { id: e.id } }),
    }));

  return (
    <View style={{ gap: 20 }}>
      {categoryShelves([...grips, ...mine]).map((s) => (
        <ExerciseShelf key={s.kind} kind={s.kind} cards={s.entries} onAdd={() => onAdd(s.kind)} />
      ))}
    </View>
  );
}
