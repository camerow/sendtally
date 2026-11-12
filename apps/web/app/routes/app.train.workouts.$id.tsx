import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { WorkoutPage } from "../training/library-detail/WorkoutPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function WorkoutRoute(): React.ReactElement {
  return (
    <HangDataProvider>
      <WorkoutPage id={useParams().id ?? ""} />
    </HangDataProvider>
  );
}
