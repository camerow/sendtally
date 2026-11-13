import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { WorkoutEditorPage } from "../training/editor/WorkoutEditorPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function EditWorkoutRoute(): React.ReactElement {
  return (
    <HangDataProvider>
      <WorkoutEditorPage id={useParams().id ?? ""} />
    </HangDataProvider>
  );
}
