import React from "react";
import { findClimb, type ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  localDate,
  withClimbName,
  withPickedClimb,
  type ClimbDraft,
  type ClimbEditor,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { ClimbEditorSheet } from "../../log-session/components/ClimbEditorSheet";

export type LiveClimbEditorProps = {
  editor: ClimbEditor;
  scales: GradePrefs;
  vocabulary: ClimbVocabulary;
  gyms: readonly Gym[];
};

/** The form's climb sheet, for a climb logged today or on an earlier day. */
export function LiveClimbEditor({
  editor,
  scales,
  vocabulary,
  gyms,
}: LiveClimbEditorProps): React.ReactElement | null {
  const { editing } = editor;
  if (editing === null) return null;
  const { climb, place } = editing;
  const isProject = (c: ClimbDraft): boolean => c.project ?? vocabulary.isProject(c.name);

  return (
    <ClimbEditorSheet
      climb={climb}
      index={place?.index ?? 0}
      count={place?.count ?? 0}
      gyms={gyms}
      prefs={scales}
      removable
      project={isProject(climb)}
      suggestions={vocabulary.suggestionsFor(climb.name)}
      date={{ value: editing.date, max: localDate(new Date()), onChange: editor.setDate }}
      saving={editor.status === "saving"}
      error={editor.status === "failed" ? t("logSession.climbSaveFailed") : null}
      onChange={(c) => editor.change(() => c)}
      onChangeName={(name) =>
        editor.change((c) => withClimbName(c, name, findClimb(vocabulary.climbs, name)))
      }
      onPick={(known) => editor.change((c) => withPickedClimb(c, known))}
      onToggleProject={() => editor.change((c) => ({ ...c, project: !isProject(c) }))}
      onRemove={editor.remove}
      onClose={editor.save}
    />
  );
}
