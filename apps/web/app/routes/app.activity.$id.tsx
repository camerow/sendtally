import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";

import detailStyles from "../components/detail/detail.css?url";
import stravaStyles from "../components/detail/strava.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { WorkoutSummaryPage } from "../training/summary/WorkoutSummaryPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: stravaStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function Route(): React.ReactElement {
  const id = useParams().id ?? "";
  return (
    <HangDataProvider>
      <WorkoutSummaryPage id={id} />
    </HangDataProvider>
  );
}
