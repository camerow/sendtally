import React from "react";
import { Navigate, useSearchParams } from "react-router";
import { readWorkoutRun } from "@sendtally/features/workouts";
import { ChecklistPage } from "../training/players/ChecklistPage";

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  const run = readWorkoutRun(Object.fromEntries(params));
  return run === null ? (
    <Navigate to="/app/plan" replace />
  ) : (
    <ChecklistPage run={run} end={params.get("end") === "1"} />
  );
}
