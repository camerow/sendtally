import React from "react";
import { Navigate, useSearchParams } from "react-router";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { ExerciseEditorPage } from "../training/editor/ExerciseEditorPage";
import { EXERCISES_VIEW } from "../training/exercises/paths";

export default function NewExerciseRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const kind = WORKOUT_KINDS.find((k) => k === params.get("kind"));
  if (kind === undefined) return <Navigate to={EXERCISES_VIEW} replace />;
  return <ExerciseEditorPage making={kind} name={params.get("name") ?? ""} />;
}
