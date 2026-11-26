import React from "react";
import type { MembersGet as MembersGetView } from "@sendtally/features/billing";
import { RestPreview } from "../training/rest/RestPreview";
import { SampleExerciseHead } from "./SampleExerciseHead";

export function SampleWorkout({ view }: { view: MembersGetView }): React.ReactElement {
  const [first, second] = view.exercises;
  return (
    <>
      <SampleExerciseHead {...first} />
      <RestPreview seconds={view.restS} />
      <SampleExerciseHead {...second} />
    </>
  );
}
