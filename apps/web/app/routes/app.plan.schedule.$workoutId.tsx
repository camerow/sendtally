import React from "react";
import type { LinksFunction } from "react-router";
import { useParams, useSearchParams } from "react-router";
import { addFlowOf } from "@sendtally/features/training";
import planStyles from "../training/plan-week/plan.css?url";
import { SchedulePage } from "../training/schedule/SchedulePage";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: planStyles }];

export default function ScheduleRoute(): React.ReactElement {
  const { workoutId = "" } = useParams();
  const [params] = useSearchParams();
  const flow = addFlowOf({
    date: params.get("date") ?? undefined,
    blockId: params.get("blockId") ?? undefined,
  });
  return <SchedulePage workoutId={workoutId} flow={flow} />;
}
