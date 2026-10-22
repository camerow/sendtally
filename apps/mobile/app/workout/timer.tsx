import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { readPlanLink } from "../../features/training/data/planLinkParams";
import { TimerScreen } from "../../features/training/timer/TimerScreen";

export default function TimerRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ workoutId: string; gripId: string }>();
  return (
    <HangDataProvider>
      <TimerScreen
        workoutId={params.workoutId}
        gripId={params.gripId}
        link={readPlanLink(params)}
      />
    </HangDataProvider>
  );
}
