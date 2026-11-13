import React from "react";
import type { LinksFunction } from "react-router";
import { useSearchParams } from "react-router";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { readFocus } from "@sendtally/features/training";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { WorkoutEditorPage } from "../training/editor/WorkoutEditorPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function NewWorkoutRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const kind = WORKOUT_KINDS.find((k) => k === params.get("kind"));
  return (
    <HangDataProvider>
      <WorkoutEditorPage kind={kind} focus={readFocus(params.get("focus") ?? undefined) ?? null} />
    </HangDataProvider>
  );
}
