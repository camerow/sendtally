import React from "react";
import { useSearchParams } from "react-router";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { readFocus } from "@sendtally/features/training";
import { WorkoutEditorPage } from "../training/editor/WorkoutEditorPage";

export default function NewWorkoutRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const kind = WORKOUT_KINDS.find((k) => k === params.get("kind"));
  return (
    <WorkoutEditorPage kind={kind} focus={readFocus(params.get("focus") ?? undefined) ?? null} />
  );
}
