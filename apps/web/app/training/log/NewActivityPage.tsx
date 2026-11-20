import React from "react";
import {
  newActivityDraft,
  type ActivityDraft,
  type ActivityPrefill,
} from "@sendtally/features/activities";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { useGrips } from "@sendtally/features/hang";
import {
  idleEnd,
  livePartForm,
  partEnded,
  usePrescribed,
  useWorkoutLibrary,
} from "@sendtally/features/workouts";
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
  const { isGrip, gripName } = useGrips(api);
  // A mix's grips are its fingerboard part: the sets it held when it ran, and
  // nothing when it is logged without running.
  const [part] = React.useState(() => {
    const state = params.live === "1" ? store.read()?.state : undefined;
    const fingers = state?.player === "sets" ? state.fingers : undefined;
    const rows = partEnded(fingers, gripName);
    return rows === undefined ? undefined : livePartForm(rows);
  });
  const prescribed = usePrescribed(
    api,
    params.workoutId ?? null,
    readPlanLink(params),
    readSession(params)
  );
  const library = useWorkoutLibrary(api).state;
  const targetRpe =
    library.status === "ready" && params.workoutId !== undefined
      ? (library.data.workout(params.workoutId)?.targetRpe ?? undefined)
      : undefined;
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
      idleEnd={idleEnd(params)}
      planned={prescribed}
      {...(targetRpe !== undefined && { targetRpe })}
      {...(part !== undefined && { part, gripName: model.gripName })}
    />
  );
}
