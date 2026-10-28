import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { ExerciseCategoryScreen } from "../../features/training/exercises/ExerciseCategoryScreen";

export default function ExerciseCategoryRoute(): React.ReactElement {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const known = WORKOUT_KINDS.find((k) => k === kind);
  if (known === undefined) return <Redirect href="/(tabs)/train" />;
  return (
    <HangDataProvider>
      <ExerciseCategoryScreen kind={known} />
    </HangDataProvider>
  );
}
