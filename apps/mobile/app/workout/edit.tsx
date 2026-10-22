import { useLocalSearchParams } from "expo-router";
import React from "react";
import { PLAN_KINDS } from "@sendtally/features/activities";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutEditorScreen } from "../../features/training/workout-editor/WorkoutEditorScreen";

export default function WorkoutEditRoute(): React.ReactElement {
  const { id, from, category } = useLocalSearchParams<{
    id?: string;
    from?: string;
    category?: string;
  }>();
  return (
    <HangDataProvider>
      <WorkoutEditorScreen id={id} from={from} category={PLAN_KINDS.find((k) => k === category)} />
    </HangDataProvider>
  );
}
