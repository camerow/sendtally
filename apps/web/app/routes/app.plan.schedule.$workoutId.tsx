import React from "react";
import type { LinksFunction } from "react-router";
import { useParams, useSearchParams } from "react-router";
import { addFlowOf } from "@sendtally/features/training";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import planStyles from "../training/plan-week/plan.css?url";
import { SchedulePage } from "../training/schedule/SchedulePage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: planStyles },
];

export default function ScheduleRoute(): React.ReactElement {
  const { workoutId = "" } = useParams();
  const [params] = useSearchParams();
  const flow = addFlowOf({
    date: params.get("date") ?? undefined,
    blockId: params.get("blockId") ?? undefined,
  });
  return (
    <HangDataProvider>
      <SchedulePage workoutId={workoutId} flow={flow} />
    </HangDataProvider>
  );
}
