import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { TimerScreen } from "../../features/training/timer/TimerScreen";

export default function TimerRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ workoutId: string; gripId: string; end?: string }>();
  return (
    <HangDataProvider>
      <TimerScreen
        workoutId={params.workoutId}
        gripId={params.gripId}
        link={readPlanLink(params)}
        session={readSession(params)}
        end={params.end === "1"}
      />
    </HangDataProvider>
  );
}
