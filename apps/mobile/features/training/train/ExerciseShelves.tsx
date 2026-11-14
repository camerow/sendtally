import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useWeightUnit } from "@sendtally/features/activities";
import { exerciseShelves } from "@sendtally/features/exercises";
import { useExerciseSeries, useExercises } from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { openExerciseEditor } from "../exercises/openExerciseEditor";
import { useLibrary } from "../library/useLibrary";
import { ExerciseShelf } from "./ExerciseShelf";

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

  const shelves = exerciseShelves({
    exercises: exercises.state.data,
    grips: model.grips,
    sessions: model.sessions,
    series: series.status === "ready" ? series.data : [],
    workouts: library.status === "ready" ? library.data.workouts : [],
    today,
    unit,
  });
  return (
    <View style={{ gap: 20 }}>
      {shelves.map((s) => (
        <ExerciseShelf
          key={s.kind}
          kind={s.kind}
          cards={s.entries.map((c) => ({
            ...c,
            open: () =>
              "grip" in c.opens
                ? router.push({ pathname: "/grip/[id]", params: { id: c.opens.grip } })
                : router.push({ pathname: "/exercise/[id]", params: { id: c.opens.exercise } }),
          }))}
          onAdd={() => openExerciseEditor(s.kind)}
          onSeeAll={() => router.push({ pathname: "/exercise/category", params: { kind: s.kind } })}
        />
      ))}
    </View>
  );
}
