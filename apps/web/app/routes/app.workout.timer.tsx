import React from "react";
import { useSearchParams } from "react-router";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { PartTimerPage, TimerPage } from "../training/players/timer/TimerPage";

export default function Route(): React.ReactElement {
  const [search] = useSearchParams();
  const params = Object.fromEntries(search);
  if (params.part === "1") return <PartTimerPage workoutId={params.workoutId ?? ""} />;
  return (
    <TimerPage
      workoutId={params.workoutId ?? ""}
      gripId={params.gripId ?? ""}
      link={readPlanLink(params)}
      session={readSession(params)}
      end={params.end === "1"}
    />
  );
}
