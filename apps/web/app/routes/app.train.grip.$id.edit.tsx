import React from "react";
import { useParams } from "react-router";
import { ExerciseEditorPage } from "../training/editor/ExerciseEditorPage";

export default function EditGripRoute(): React.ReactElement | null {
  const id = useParams().id ?? "";
  return <ExerciseEditorPage grip={id} />;
}
