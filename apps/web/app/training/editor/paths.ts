import type { Focus, WorkoutKind } from "@sendtally/core/hang";
import { focusParam } from "@sendtally/features/training";

const withParams = (pathname: string, params: Record<string, string>): string =>
  `${pathname}?${new URLSearchParams(params).toString()}`;

export const newWorkoutPath = (kind: WorkoutKind, focus: Focus | null = null): string =>
  withParams("/app/train/workouts/new", { kind, focus: focusParam(focus) });

export const editWorkoutPath = (id: string): string =>
  `/app/train/workouts/${encodeURIComponent(id)}/edit`;

export const newExercisePath = (kind: WorkoutKind, name = ""): string =>
  withParams("/app/train/exercise/new", { kind, ...(name !== "" && { name }) });

export const editExercisePath = (id: string): string =>
  `/app/train/exercise/${encodeURIComponent(id)}/edit`;

export const editGripPath = (id: string): string =>
  `/app/train/grip/${encodeURIComponent(id)}/edit`;
