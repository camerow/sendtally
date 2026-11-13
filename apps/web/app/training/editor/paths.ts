import type { Focus, WorkoutKind } from "@sendtally/core/hang";
import { focusParam } from "@sendtally/features/training";

export const newWorkoutPath = (kind: WorkoutKind, focus: Focus | null = null): string =>
  `/app/train/workouts/new?${new URLSearchParams({ kind, focus: focusParam(focus) })}`;

export const editWorkoutPath = (id: string): string =>
  `/app/train/workouts/${encodeURIComponent(id)}/edit`;

export const newExercisePath = (kind: WorkoutKind, name = ""): string =>
  `/app/train/exercise/new?${new URLSearchParams({ kind, ...(name !== "" && { name }) })}`;

export const editExercisePath = (id: string): string =>
  `/app/train/exercise/${encodeURIComponent(id)}/edit`;

export const editGripPath = (id: string): string =>
  `/app/train/grip/${encodeURIComponent(id)}/edit`;
