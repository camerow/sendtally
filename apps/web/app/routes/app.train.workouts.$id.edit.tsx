import React from "react";
import { useParams } from "react-router";
import { WorkoutEditorPage } from "../training/editor/WorkoutEditorPage";

export default function EditWorkoutRoute(): React.ReactElement {
  return <WorkoutEditorPage id={useParams().id ?? ""} />;
}
