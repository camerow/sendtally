import type { WorkoutDraft } from "@sendtally/features/workouts";

/** The workout editor's state: text where it edits text; what it holds passes through as it was. */
export type WorkoutEditorState = Omit<WorkoutDraft, "description"> & { description: string };
