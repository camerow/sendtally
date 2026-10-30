import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { ExerciseScreen } from "../../features/training/exercises/ExerciseScreen";

export default function ExerciseRoute(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <HangDataProvider framed>
      <ExerciseScreen id={id} />
    </HangDataProvider>
  );
}
