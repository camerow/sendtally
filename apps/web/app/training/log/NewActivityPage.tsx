import React from "react";
import {
  newActivityDraft,
  type ActivityDraft,
  type ActivityPrefill,
} from "@sendtally/features/activities";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { usePrescribed } from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { ActivityForm } from "./ActivityForm";

/**
 * A new activity, opened with what a workout already knows: its kind, title, the day, itself
 * and the plan it ran. What it prescribes starts as done, so the form waits for it to load.
 */
export function NewActivityPage({
  params,
}: {
  params: ActivityPrefill;
}): React.ReactElement | null {
  const { today } = useHangData();
  const [id] = React.useState(() => crypto.randomUUID());
  const prescribed = usePrescribed(
    useAppApi(),
    params.workoutId ?? null,
    readPlanLink(params),
    readSession(params)
  );
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && prescribed !== undefined)
    setInitial(newActivityDraft(params, today, prescribed));
  return initial === null ? null : (
    <ActivityForm
      id={id}
      initial={initial}
      logged={null}
      kindSet={params.kind !== undefined}
      planned={prescribed}
    />
  );
}
