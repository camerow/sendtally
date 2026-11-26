import { useLocalSearchParams } from "expo-router";
import React from "react";
import { OwnerKnown } from "../../features/live-session/OwnerKnown";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { PartTimerScreen, TimerScreen } from "../../features/training/timer/TimerScreen";

export default function TimerRoute(): React.ReactElement {
  const params = useLocalSearchParams<{
    workoutId: string;
    gripId: string;
    end?: string;
    part?: string;
    item?: string;
    set?: string;
  }>();
  return (
    <OwnerKnown>
      <HangDataProvider>
        {params.part === "1" ? (
          <PartTimerScreen
            workoutId={params.workoutId}
            start={
              params.item === undefined
                ? null
                : { item: Number(params.item), set: Number(params.set ?? 0) }
            }
          />
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
    </OwnerKnown>
  );
}
