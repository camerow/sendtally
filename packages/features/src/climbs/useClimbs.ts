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
import { patch, useLocalWrite } from "../outbox";
import { climbDetailVM, type ClimbDetailVM } from "./overview";
import { withClimbNote, withoutClimbNote } from "./projects";

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
  setWorking: (working: boolean) => Promise<void>;
  /** Writes a note on the climb's page, a new one when it has no id yet; saved on the phone first. */
  saveNote: (note: Omit<ClimbNote, "id"> & { id?: string }) => void;
  deleteNote: (id: string) => void;
  reload: () => Promise<void>;
};

/** A climb by its id, or by the slug a web link carries. */
export function useClimb(api: SendtallyApi, idOrSlug: string, newId: () => string): ClimbFeature {
  const { state: loaded, reload } = useClimbs(api);
  const local = useLocalWrite();
  const state = React.useMemo((): ClimbFeature["state"] => {
    if (loaded.status !== "ready") return loaded;
    const { climbs, sessions } = loaded.data;
    const climb = climbs.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    if (climb === undefined) return { status: "error", message: t("climbs.notFound") };
    return { status: "ready", data: { climb, vm: climbDetailVM(climb, sessions) } };
  }, [loaded, idOrSlug]);
  const id = state.status === "ready" ? state.data.climb.id : null;

  const setWorking = React.useCallback(
    async (working: boolean): Promise<void> => {
      if (id !== null) await api.updateClimb(id, { working });
    },
    [api, id]
  );
  const saveNote = React.useCallback(
    ({ id: noteId, ...rest }: Omit<ClimbNote, "id"> & { id?: string }): void => {
      if (id === null) throw new Error("climb not loaded");
      const note = { id: noteId ?? newId(), ...rest };
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
    [api, id, local, newId]
  );
  const deleteNote = React.useCallback(
    (noteId: string): void => {
      if (id === null) throw new Error("climb not loaded");
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
    [api, id, local]
  );
  return { state, setWorking, saveNote, deleteNote, reload };
}
