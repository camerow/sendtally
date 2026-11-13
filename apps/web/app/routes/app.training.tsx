import React from "react";
import type { LinksFunction } from "react-router";
import { Outlet } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import stravaStyles from "../components/detail/strava.css?url";
import pageActionStyles from "../components/page-action.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import blockStyles from "../training/blocks/blocks.css?url";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: stravaStyles },
  { rel: "stylesheet", href: pageActionStyles },
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: blockStyles },
];

/** Every training page below Train: their stylesheets, and the training loaded once for all of them. */
export default function TrainingLayout(): React.ReactElement {
  return (
    <HangDataProvider>
      <Outlet />
    </HangDataProvider>
  );
}
