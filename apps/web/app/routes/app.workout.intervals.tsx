import React from "react";
import { Navigate, useSearchParams } from "react-router";
import { readIntervalsParams } from "@sendtally/features/workouts";
import { IntervalsPage } from "../training/players/timer/IntervalsPage";

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  const workout = readIntervalsParams(Object.fromEntries(params));
  return workout === null ? (
    <Navigate to="/app/plan" replace />
  ) : (
    <IntervalsPage workout={workout} end={params.get("end") === "1"} />
  );
}
