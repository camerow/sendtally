import React from "react";
import type { LinksFunction } from "react-router";
import { useParams, useSearchParams } from "react-router";
import planStyles from "../training/plan-week/plan.css?url";
import { SchedulePage } from "../training/schedule/SchedulePage";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: planStyles }];

export default function ScheduleRoute(): React.ReactElement {
  const { workoutId } = useParams();
  const [params] = useSearchParams();
  return <SchedulePage workoutId={workoutId} exerciseId={params.get("exercise") ?? undefined} />;
}
