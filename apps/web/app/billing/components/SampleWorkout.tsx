import React from "react";
import type { MembersGet as MembersGetView } from "@sendtally/features/billing";
import { YoursTag } from "../../first-run/plan/components/YoursTag";
import { RestPreview } from "../../training/players/RestPreview";

export function SampleWorkout({ view }: { view: MembersGetView }): React.ReactElement {
  const head = (e: MembersGetView["exercises"][number]): React.ReactElement => (
    <span className="members-get-exercise">
      <span className="members-get-exercise-name">
        {e.name}
        {e.yours && <YoursTag />}
      </span>
      <span className="members-get-exercise-work">{e.work}</span>
    </span>
  );
  return (
    <>
      {head(view.exercises[0])}
      <RestPreview seconds={view.restS} />
      {head(view.exercises[1])}
    </>
  );
}
