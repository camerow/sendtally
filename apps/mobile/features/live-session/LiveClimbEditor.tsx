import React from "react";
import { findClimb, type ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import {
  withClimbName,
  withPickedClimb,
  type ClimbDraft,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { ClimbEditorSheet } from "../log-session/ClimbEditorSheet";

export type LiveClimbEditorProps = {
  /** The live climb being corrected; null while the sheet is closed. */
  climb: ClimbDraft | null;
  index: number;
  count: number;
  prefs: GradePrefs;
  vocabulary: ClimbVocabulary;
  gyms: readonly Gym[];
  onChange: (climb: ClimbDraft) => void;
  onRemove: () => void;
  onClose: () => void;
};

/** The form's climb editor, writing straight into the live session as each field changes. */
export function LiveClimbEditor({
  climb,
  index,
  count,
  prefs,
  vocabulary,
  gyms,
  onChange,
  onRemove,
  onClose,
}: LiveClimbEditorProps): React.ReactElement {
  const project = climb === null ? false : (climb.project ?? vocabulary.isProject(climb.name));
  return (
    <ClimbEditorSheet
      climb={climb}
      index={index}
      count={count}
      removable
      prefs={prefs}
      gyms={gyms}
      project={project}
      known={climb === null ? null : (findClimb(vocabulary.climbs, climb.name) ?? null)}
      suggestions={vocabulary.suggestionsFor(climb?.name ?? "")}
      onChange={onChange}
      onChangeName={(name) => {
        if (climb !== null)
          onChange(withClimbName(climb, name, findClimb(vocabulary.climbs, name)));
      }}
      onPick={(known) => {
        if (climb !== null) onChange(withPickedClimb(climb, known));
      }}
      onToggleProject={() => {
        if (climb !== null) onChange({ ...climb, project: !project });
      }}
      onRemove={onRemove}
      onClose={onClose}
    />
  );
}
