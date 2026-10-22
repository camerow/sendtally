import { t } from "@sendtally/features/i18n";
import type { WorkoutDraft } from "@sendtally/features/workouts";
import type { WorkoutEditorState } from "./types";

export function editorStateOf(draft: WorkoutDraft): WorkoutEditorState {
  return { ...draft };
}

/** What saving writes: trimmed text, and an untitled workout takes a name. */
export function draftOfEditor(s: WorkoutEditorState): WorkoutDraft {
  return {
    ...s,
    name: s.name.trim().slice(0, 80) || t("hang.untitledWorkout"),
    description: s.description.trim(),
  };
}
