import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { PartTimerScreen, TimerScreen } from "../../features/training/timer/TimerScreen";

export default function TimerRoute(): React.ReactElement {
  const params = useLocalSearchParams<{
    workoutId: string;
    gripId: string;
    end?: string;
    part?: string;
  }>();
  return (
    <HangDataProvider>
      {params.part === "1" ? (
        <PartTimerScreen workoutId={params.workoutId} />
      ) : (
        <TimerScreen
          workoutId={params.workoutId}
          gripId={params.gripId}
          link={readPlanLink(params)}
          session={readSession(params)}
          end={params.end === "1"}
        />
      )}
    </HangDataProvider>
  );
}
