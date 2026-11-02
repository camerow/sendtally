import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { ExerciseEditorScreen } from "../../features/training/exercises/ExerciseEditorScreen";

export default function ExerciseEditRoute(): React.ReactElement {
  const { kind, id, name, ret } = useLocalSearchParams<{
    kind?: string;
    id?: string;
    name?: string;
    ret?: string;
  }>();
  const known = WORKOUT_KINDS.find((k) => k === kind);
  if (known === undefined) return <Redirect href="/(tabs)/train" />;
  return (
    <HangDataProvider>
      <ExerciseEditorScreen kind={known} id={id} name={name} ret={ret} />
    </HangDataProvider>
  );
}
