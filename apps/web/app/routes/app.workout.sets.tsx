import React from "react";
import { OwnerKnown } from "../lib/OwnerKnown";
import { Navigate, useSearchParams, type LinksFunction } from "react-router";
import { readWorkoutRun } from "@sendtally/features/workouts";
import liveStyles from "../live-session/live-session.css?url";
import logSessionStyles from "../log-session/log-session.css?url";
import { SetsPage } from "../training/players/SetsPage";

/** The climb editor and gym picker a climbing card opens are the live tally's own sheets. */
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: liveStyles },
];

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  const run = readWorkoutRun(Object.fromEntries(params));
  return run === null ? (
    <Navigate to="/app/plan" replace />
  ) : (
    <OwnerKnown>
      <SetsPage run={run} end={params.get("end") === "1"} />
    </OwnerKnown>
  );
}
