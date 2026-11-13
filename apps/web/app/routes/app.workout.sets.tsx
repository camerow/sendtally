import React from "react";
import { Navigate, useSearchParams } from "react-router";
import { readWorkoutRun } from "@sendtally/features/workouts";
import { SetsPage } from "../training/players/SetsPage";

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  const run = readWorkoutRun(Object.fromEntries(params));
  return run === null ? (
    <Navigate to="/app/plan" replace />
  ) : (
    <SetsPage run={run} end={params.get("end") === "1"} />
  );
}
