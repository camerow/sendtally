import React from "react";
import { useParams } from "react-router";
import { ExercisePage } from "../training/exercises/ExercisePage";

export default function ExerciseRoute(): React.ReactElement | null {
  return <ExercisePage id={useParams().id ?? ""} />;
}
