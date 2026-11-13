import React from "react";
import { Navigate, useParams } from "react-router";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { ExerciseCategoryPage } from "../training/exercises/ExerciseCategoryPage";
import { EXERCISES_VIEW } from "../training/exercises/paths";

export default function ExerciseCategoryRoute(): React.ReactElement {
  const param = useParams().kind;
  const kind = WORKOUT_KINDS.find((k) => k === param);
  if (kind === undefined) return <Navigate to={EXERCISES_VIEW} replace />;
  return <ExerciseCategoryPage kind={kind} />;
}
