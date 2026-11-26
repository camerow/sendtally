import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { exerciseShelves } from "@sendtally/features/exercises";
import { useExercises } from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { openExercise } from "../exercises/openExercise";
import { openExerciseEditor } from "../exercises/openExerciseEditor";
import { useLibrary } from "../library/useLibrary";
import { openMembershipPage, useLocks } from "../locks";
import { useLockedExercises } from "../useLockedRows";
import { ExerciseShelf } from "./ExerciseShelf";

/**
 * Train > Exercises: every category, each exercise with how many workouts use it.
 * Fingers holds the user's own grips and the built-in ones they have hung on. A plus makes
 * one in its category, See all opens the category whole.
 */
export function ExerciseShelves(): React.ReactElement {
  const api = useApi();
  const { model } = useHangData();
  const exercises = useExercises(api);
  const library = useLibrary().state;
  const locked = useLockedExercises();
  const create = useLocks().create;
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;

  const shelves = exerciseShelves({
    exercises: exercises.state.data,
    grips: model.grips,
    workouts: library.status === "ready" ? library.data.workouts : [],
  });
  return (
    <View style={{ gap: 20 }}>
      {shelves.map((s) => (
        <ExerciseShelf
          key={s.kind}
          kind={s.kind}
          cards={s.entries.map((c) => ({
            ...c,
            press: locked.row(c, () => openExercise(c.source)),
          }))}
          onAdd={() => (create ? openMembershipPage("create") : openExerciseEditor(s.kind))}
          addLocked={create}
          onSeeAll={() => router.push({ pathname: "/exercise/category", params: { kind: s.kind } })}
        />
      ))}
      {locked.sheet}
    </View>
  );
}
