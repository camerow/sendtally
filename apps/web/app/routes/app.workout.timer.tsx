import React from "react";
import { useSearchParams } from "react-router";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { TimerPage } from "../training/players/timer/TimerPage";

export default function Route(): React.ReactElement {
  const [search] = useSearchParams();
  const params = Object.fromEntries(search);
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
