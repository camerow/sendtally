import React from "react";
import type { LinksFunction } from "react-router";
import { TrainPage } from "../training/library/TrainPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: trainingStyles }];

export default function TrainRoute(): React.ReactElement {
  return <TrainPage />;
}
