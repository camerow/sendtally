import React from "react";
import type { LinksFunction } from "react-router";
import { Navigate, useParams } from "react-router";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { ExerciseCategoryPage } from "../training/exercises/ExerciseCategoryPage";
import { EXERCISES_VIEW } from "../training/exercises/paths";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function ExerciseCategoryRoute(): React.ReactElement {
  const param = useParams().kind;
  const kind = WORKOUT_KINDS.find((k) => k === param);
  if (kind === undefined) return <Navigate to={EXERCISES_VIEW} replace />;
  return (
    <HangDataProvider>
      <ExerciseCategoryPage kind={kind} />
    </HangDataProvider>
  );
}
