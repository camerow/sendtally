import React from "react";
import type { LinksFunction } from "react-router";
import { TrainPage } from "../training/library/TrainPage";
import detailStyles from "../components/detail/detail.css?url";
import pageActionStyles from "../components/page-action.css?url";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: pageActionStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function TrainRoute(): React.ReactElement {
  return <TrainPage />;
}
