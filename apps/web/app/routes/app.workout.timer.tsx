import React from "react";
import { OwnerKnown } from "../lib/OwnerKnown";
import { useSearchParams } from "react-router";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { PartTimerPage, TimerPage } from "../training/players/timer/TimerPage";

export default function Route(): React.ReactElement {
  const [search] = useSearchParams();
  const params = Object.fromEntries(search);
  if (params.part === "1")
    return (
      <PartTimerPage
        workoutId={params.workoutId ?? ""}
        start={
          params.item === undefined
            ? null
            : { item: Number(params.item), set: Number(params.set ?? 0) }
        }
      />
    );
  return (
    <OwnerKnown>
      <TimerPage
        workoutId={params.workoutId ?? ""}
        gripId={params.gripId ?? ""}
        link={readPlanLink(params)}
        session={readSession(params)}
        end={params.end === "1"}
      />
    </OwnerKnown>
  );
}
