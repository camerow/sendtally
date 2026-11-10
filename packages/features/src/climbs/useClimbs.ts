import React from "react";
import type {
  Activity,
  ClimbNote,
  ClimbSummary,
  SendtallyApi,
  SessionWithClimbs,
} from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQueryPair, type QueryState } from "../query";
import { useGradeScalePrefs } from "../settings/useGradeScales";
import { patch, useLocalWrite } from "../outbox";
import { climbDetailVM, type ClimbDetailVM } from "./overview";
import { withClimbNote, withoutClimbNote, type ProjectNoteVM } from "./projects";

/** The user's climbs and climbing sessions, and the training beside them, whose workouts log climbs too. */
export type ClimbsData = {
  climbs: ClimbSummary[];
  sessions: SessionWithClimbs[];
  activities: Activity[];
};

export type ClimbsFeature = { state: QueryState<ClimbsData>; reload: () => Promise<void> };

export function useClimbs(api: SendtallyApi): ClimbsFeature {
  const { state: loaded, reload } = useQueryPair(
    queries.climbs(api),
    queries.sessionsWithClimbs(api)
  );
  const state = React.useMemo((): QueryState<ClimbsData> => {
    if (loaded.status !== "ready") return loaded;
    const [climbs, { sessions, activities }] = loaded.data;
    return { status: "ready", data: { climbs, sessions, activities } };
  }, [loaded]);
  return { state, reload };
}

export type ClimbFeature = {
  state: QueryState<{ climb: ClimbSummary; vm: ClimbDetailVM }>;
  /**
   * Writes a note: a new page note when it has no id, saved on the phone first; a session's note
   * is rewritten on that session, on its day.
   */
  saveNote: (note: Omit<ClimbNote, "id"> & Partial<Pick<ProjectNoteVM, "id" | "source">>) => void;
  /** Deletes a page note; a session's note is cleared. */
  deleteNote: (note: Pick<ProjectNoteVM, "id" | "source">) => void;
  /** Deletes the climb, leaving its sessions as logged. */
  remove: () => void;
  reload: () => Promise<void>;
};

/** A climb by its id, or by the slug a web link carries. */
export function useClimb(api: SendtallyApi, idOrSlug: string, newId: () => string): ClimbFeature {
  const { state: loaded, reload } = useClimbs(api);
  const local = useLocalWrite();
  const { scales } = useGradeScalePrefs(api);
  const state = React.useMemo((): ClimbFeature["state"] => {
    if (loaded.status !== "ready") return loaded;
    const { climbs, sessions } = loaded.data;
    const climb = climbs.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    if (climb === undefined) return { status: "error", message: t("climbs.notFound") };
    return { status: "ready", data: { climb, vm: climbDetailVM(climb, sessions, scales) } };
  }, [loaded, idOrSlug, scales]);
  const id = state.status === "ready" ? state.data.climb.id : null;
  const slug = state.status === "ready" ? state.data.climb.slug : null;

  const setSessionNote = React.useCallback(
    (fingerprint: string, note: string): void => {
      if (slug === null) throw new Error("climb not loaded");
      void api.setClimbNote(fingerprint, slug, note).then(reload, reload);
    },
    [api, slug, reload]
  );
  const saveNote = React.useCallback(
    ({
      id: noteId,
      source,
      ...rest
    }: Omit<ClimbNote, "id"> & Partial<Pick<ProjectNoteVM, "id" | "source">>): void => {
      if (id === null) throw new Error("climb not loaded");
      if (source === "session" && noteId !== undefined) return setSessionNote(noteId, rest.note);
      const note = { id: noteId ?? newId(), day: rest.day, note: rest.note };
      local(
        {
          key: `climb-note:${note.id}`,
          kind: noteId === undefined ? "create" : "update",
          method: "saveClimbNote",
          args: [id, note],
        },
        patch<ClimbSummary[]>(queries.climbs(api).queryKey, (list) => withClimbNote(list, id, note))
      );
    },
    [api, id, local, newId, setSessionNote]
  );
  const deleteNote = React.useCallback(
    ({ id: noteId, source }: Pick<ProjectNoteVM, "id" | "source">): void => {
      if (id === null) throw new Error("climb not loaded");
      if (source === "session") return setSessionNote(noteId, "");
      local(
        {
          key: `climb-note:${noteId}`,
          kind: "delete",
          method: "deleteClimbNote",
          args: [id, noteId],
        },
        patch<ClimbSummary[]>(queries.climbs(api).queryKey, (list) =>
          withoutClimbNote(list, id, noteId)
        )
      );
    },
    [api, id, local, setSessionNote]
  );
  const remove = React.useCallback((): void => {
    if (id === null) return;
    void api.deleteClimb(id).then(reload, reload);
  }, [api, id, reload]);
  return { state, saveNote, deleteNote, remove, reload };
}
