import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import { ExercisePage } from "../training/exercises/ExercisePage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function ExerciseRoute(): React.ReactElement | null {
  return <ExercisePage id={useParams().id ?? ""} />;
}
