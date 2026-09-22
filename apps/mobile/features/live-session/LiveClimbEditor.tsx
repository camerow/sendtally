import React from "react";
import { findClimb, type ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import {
  withClimbName,
  withPickedClimb,
  type ClimbDraft,
  type LiveSession,
} from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { useApi } from "../../lib/api";
import { ClimbEditorSheet } from "../log-session/ClimbEditorSheet";

export type LiveClimbEditorProps = {
  live: LiveSession;
  vocabulary: ClimbVocabulary;
  gyms: readonly Gym[];
  editingKey: string | null;
  onClose: () => void;
};

/** The same climb editor the form uses, pointed at the live session on disk. */
export function LiveClimbEditor({
  live,
  vocabulary,
  gyms,
  editingKey,
  onClose,
}: LiveClimbEditorProps): React.ReactElement {
  const api = useApi();
  const { scales } = useGradeScalePrefs(api);
  const climbs = live.stored?.draft.climbs ?? [];
  const index = climbs.findIndex((c) => c.key === editingKey);
  const climb = index < 0 ? null : climbs[index]!;
  const isProject = (c: ClimbDraft): boolean => c.project ?? vocabulary.isProject(c.name);

  return (
    <ClimbEditorSheet
      climb={climb}
      index={index}
      count={climbs.length}
      removable
      prefs={scales}
      gyms={gyms}
      project={climb === null ? false : isProject(climb)}
      known={climb === null ? null : (findClimb(vocabulary.climbs, climb.name) ?? null)}
      suggestions={vocabulary.suggestionsFor(climb?.name ?? "")}
      onChange={(c) => live.updateClimb(c.key, () => c, gyms)}
      onChangeName={(name) => {
        if (climb === null) return;
        live.updateClimb(climb.key, (c) =>
          withClimbName(c, name, findClimb(vocabulary.climbs, name))
        );
      }}
      onPick={(known) => {
        if (climb !== null) live.updateClimb(climb.key, (c) => withPickedClimb(c, known));
      }}
      onToggleProject={() => {
        if (climb !== null) live.updateClimb(climb.key, (c) => ({ ...c, project: !isProject(c) }));
      }}
      onRemove={() => {
        if (climb !== null) live.removeClimb(climb.key);
        onClose();
      }}
      onClose={onClose}
    />
  );
}
