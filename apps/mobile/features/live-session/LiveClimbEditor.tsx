import React from "react";
import { Alert } from "react-native";
import { findClimb, type ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  localDate,
  withClimbName,
  withPickedClimb,
  type ClimbDraft,
  type ClimbEditor,
} from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { useApi } from "../../lib/api";
import { ClimbEditorSheet } from "../log-session/ClimbEditorSheet";

export type LiveClimbEditorProps = {
  editor: ClimbEditor;
  vocabulary: ClimbVocabulary;
  gyms: readonly Gym[];
};

/**
 * The same climb editor the form uses, for a climb logged today or on an earlier day. A failed
 * save asks with an alert, since a sheet dragged away is no longer there to show it.
 */
export function LiveClimbEditor({
  editor,
  vocabulary,
  gyms,
}: LiveClimbEditorProps): React.ReactElement {
  const api = useApi();
  const { scales } = useGradeScalePrefs(api);
  const { editing, status, save, remove } = editor;
  const latest = React.useRef(editor);
  React.useEffect(() => {
    latest.current = editor;
  });
  const climb = editing?.climb ?? null;
  const isProject = (c: ClimbDraft): boolean => c.project ?? vocabulary.isProject(c.name);

  React.useEffect(() => {
    if (status !== "failed") return;
    Alert.alert(t("logSession.climbSaveFailed"), undefined, [
      { text: t("common.discard"), style: "destructive", onPress: () => latest.current.remove() },
      { text: t("common.tryAgain"), onPress: () => latest.current.save() },
    ]);
  }, [status]);

  return (
    <ClimbEditorSheet
      climb={climb}
      index={editing?.place?.index ?? 0}
      count={editing?.place?.count ?? 0}
      removable
      prefs={scales}
      gyms={gyms}
      project={climb === null ? false : isProject(climb)}
      known={climb === null ? null : (findClimb(vocabulary.climbs, climb.name) ?? null)}
      suggestions={vocabulary.suggestionsFor(climb?.name ?? "")}
      date={
        editing === null
          ? undefined
          : { value: editing.date, max: localDate(new Date()), onChange: editor.setDate }
      }
      saving={status === "saving"}
      onChange={(c) => editor.change(() => c)}
      onChangeName={(name) =>
        editor.change((c) => withClimbName(c, name, findClimb(vocabulary.climbs, name)))
      }
      onPick={(known) => editor.change((c) => withPickedClimb(c, known))}
      onToggleProject={() => editor.change((c) => ({ ...c, project: !isProject(c) }))}
      onRemove={remove}
      onClose={save}
    />
  );
}
