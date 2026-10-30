import { useLocalSearchParams } from "expo-router";
import React from "react";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { readFocus } from "@sendtally/features/training";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutEditorScreen } from "../../features/training/workout-editor/WorkoutEditorScreen";

export default function WorkoutEditRoute(): React.ReactElement {
  const { id, from, kind, focus } = useLocalSearchParams<{
    id?: string;
    from?: string;
    kind?: string;
    focus?: string;
  }>();
  return (
    <HangDataProvider>
      <WorkoutEditorScreen
        id={id}
        from={from}
        kind={WORKOUT_KINDS.find((k) => k === kind)}
        focus={readFocus(focus)}
      />
    </HangDataProvider>
  );
}
