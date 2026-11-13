import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { ExerciseEditorPage } from "../training/editor/ExerciseEditorPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function EditGripRoute(): React.ReactElement | null {
  const id = useParams().id ?? "";
  return (
    <HangDataProvider>
      <ExerciseEditorPage grip={id} />
    </HangDataProvider>
  );
}
