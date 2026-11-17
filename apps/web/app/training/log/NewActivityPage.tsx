import React from "react";
import {
  newActivityDraft,
  type ActivityDraft,
  type ActivityPrefill,
} from "@sendtally/features/activities";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { useGrips } from "@sendtally/features/hang";
import { livePartForm, usePrescribed } from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";
import { useLiveRunStore } from "../../lib/useLiveRun";
import { useHangData } from "../data/HangDataContext";
import { ActivityForm } from "./ActivityForm";

/**
 * A new activity, opened with what a workout already knows: its kind, title, the day, itself
 * and the plan it ran. What it prescribes starts as done, so the form waits for it to load.
 */
export function NewActivityPage({
  params,
}: {
  params: ActivityPrefill & { live?: string };
}): React.ReactElement | null {
  const { today, model } = useHangData();
  const [id] = React.useState(() => crypto.randomUUID());
  const api = useAppApi();
  const store = useLiveRunStore();
  const { isGrip } = useGrips(api);
  // A mix's grips are its fingerboard part: the rows its timer ended with when it ran, and
  // nothing when it is logged without running.
  const [part] = React.useState(() => {
    const state = params.live === "1" ? store.read()?.state : undefined;
    const fingers = state?.player === "sets" ? state.fingers : undefined;
    return fingers !== undefined && "done" in fingers ? livePartForm(fingers) : undefined;
  });
  const prescribed = usePrescribed(
    api,
    params.workoutId ?? null,
    readPlanLink(params),
    readSession(params)
  );
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && prescribed !== undefined) {
    const draft = newActivityDraft(params, today, prescribed);
    setInitial({ ...draft, done: draft.done.filter((d) => !isGrip(d.exercise)) });
  }
  return initial === null ? null : (
    <ActivityForm
      id={id}
      initial={initial}
      logged={null}
      kindSet={params.kind !== undefined}
      live={params.live === "1"}
      planned={prescribed}
      {...(part !== undefined && { part, gripName: model.gripName })}
    />
  );
}
