import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { findClimb, type ClimbVocabulary } from "@sendtally/features/climbs";
import {
  withClimbDiscipline,
  withClimbName,
  withPickedClimb,
  type ClimbDraft,
  type LiveSession,
} from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { ClimbEditorSheet } from "../../log-session/components/ClimbEditorSheet";

export type LiveClimbEditorProps = {
  api: SendtallyApi;
  live: LiveSession;
  vocabulary: ClimbVocabulary;
  editingKey: string;
  onClose: () => void;
};

/** The form's climb sheet, pointed at the live session in storage. */
export function LiveClimbEditor({
  api,
  live,
  vocabulary,
  editingKey,
  onClose,
}: LiveClimbEditorProps): React.ReactElement | null {
  const { scales } = useGradeScalePrefs(api);
  const climbs = live.stored?.draft.climbs ?? [];
  const index = climbs.findIndex((c) => c.key === editingKey);
  const climb = index < 0 ? null : climbs[index]!;
  if (climb === null) return null;
  const isProject = (c: ClimbDraft): boolean => c.project ?? vocabulary.isProject(c.name);
  const update = (patch: (c: ClimbDraft) => ClimbDraft): void => live.updateClimb(climb.key, patch);

  return (
    <ClimbEditorSheet
      climb={climb}
      index={index}
      count={climbs.length}
      scale={climb.scale}
      removable
      project={isProject(climb)}
      suggestions={vocabulary.suggestionsFor(climb.name)}
      onChange={(c) => update(() => c)}
      onChangeDiscipline={(discipline) => update((c) => withClimbDiscipline(c, discipline, scales))}
      onChangeName={(name) =>
        update((c) => withClimbName(c, name, findClimb(vocabulary.climbs, name)))
      }
      onPick={(known) => update((c) => withPickedClimb(c, known))}
      onToggleProject={() => update((c) => ({ ...c, project: !isProject(c) }))}
      onRemove={() => {
        live.removeClimb(climb.key);
        onClose();
      }}
      onClose={onClose}
    />
  );
}
