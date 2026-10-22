import type { ActivityDetail, ClimbFocus, PlanKind } from "@sendtally/api-client";

/** The workout editor's state: text where it edits text, the body as the detail editors take it. */
export type WorkoutEditorState = {
  name: string;
  category: PlanKind;
  description: string;
  tags: string;
  minutes: number | null;
  targetRpe: number | null;
  detail: ActivityDetail | null;
  focus: ClimbFocus;
  projectId: string | null;
};
