import { detailFromTemplate, templateOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { parseTags, type WorkoutDraft } from "@sendtally/features/workouts";
import type { WorkoutEditorState } from "./types";

export function editorStateOf(draft: WorkoutDraft): WorkoutEditorState {
  const body = draft.body;
  return {
    name: draft.name,
    category: draft.category,
    description: draft.description ?? "",
    tags: draft.tags.join(", "),
    minutes: draft.minutes,
    targetRpe: draft.targetRpe,
    detail: body === null || body.kind === "climb" ? null : detailFromTemplate(body),
    focus: body?.kind === "climb" ? body.focus : "limit",
    projectId: body?.kind === "climb" ? body.projectId : null,
  };
}

/** What saving writes: an untitled workout takes a name, a climbing one its focus. */
export function draftOfEditor(s: WorkoutEditorState): WorkoutDraft {
  const description = s.description.trim();
  return {
    name: s.name.trim().slice(0, 80) || t("hang.untitledWorkout"),
    category: s.category,
    description: description === "" ? null : description,
    tags: parseTags(s.tags),
    minutes: s.minutes,
    targetRpe: s.targetRpe,
    body:
      s.category === "climb"
        ? {
            kind: "climb",
            focus: s.focus,
            projectId: s.focus === "project" ? s.projectId : null,
          }
        : templateOf(s.detail),
  };
}
