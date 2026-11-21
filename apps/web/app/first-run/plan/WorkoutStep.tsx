import React from "react";
import { usePlanPath } from "@sendtally/features/settings";
import { draftOf, newWorkoutDraft, withEditorIds } from "@sendtally/features/workouts";
import { useLibrary } from "../../training/library/useLibrary";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { WorkoutBuilder } from "./components/WorkoutBuilder";

const newId = (): string => crypto.randomUUID();

/** P2: a workout the user already does, from library exercises and ones they name, saved on Continue. */
export const WorkoutStep: StepComponent = ({ wizard, api }) => {
  const { building } = usePlanPath();
  const { state } = useLibrary();
  const [id] = React.useState(() => building ?? newId());
  if (state.status !== "ready") return <WizardFrame wizard={wizard}>{null}</WizardFrame>;
  const saved = state.data.workout(id);
  const initial =
    saved === undefined ? newWorkoutDraft("other") : withEditorIds(draftOf(saved), newId);
  return <WorkoutBuilder wizard={wizard} api={api} id={id} initial={initial} />;
};
