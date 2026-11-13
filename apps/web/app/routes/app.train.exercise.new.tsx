import React from "react";
import type { LinksFunction } from "react-router";
import { Navigate, useSearchParams } from "react-router";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { ExerciseEditorPage } from "../training/editor/ExerciseEditorPage";
import { EXERCISES_VIEW } from "../training/exercises/paths";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function NewExerciseRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const kind = WORKOUT_KINDS.find((k) => k === params.get("kind"));
  if (kind === undefined) return <Navigate to={EXERCISES_VIEW} replace />;
  return (
    <HangDataProvider>
      <ExerciseEditorPage making={kind} name={params.get("name") ?? ""} />
    </HangDataProvider>
  );
}
