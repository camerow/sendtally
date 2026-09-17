import React from "react";
import type { EntryDetail, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { bothReady, queries, useQuery, type QueryState } from "../query";

export type EntryDetailData = { entry: EntryDetail; sessions: SessionRow[] };

/** An entry page reads the whole log alongside it: linked sessions, and the ones its dates cover. */
export function useEntryDetail(
  api: SendtallyApi,
  id: string
): { state: QueryState<EntryDetailData>; reload: () => Promise<void> } {
  const { state: entry, reload: reloadEntry } = useQuery(queries.entry(api, id));
  const { state: sessions, reload: reloadSessions } = useQuery(queries.sessions(api));
  const state = React.useMemo(
    () => bothReady(entry, sessions, (entry, sessions) => ({ entry, sessions })),
    [entry, sessions]
  );
  const reload = React.useCallback(async () => {
    await Promise.all([reloadEntry(), reloadSessions()]);
  }, [reloadEntry, reloadSessions]);
  return { state, reload };
}

/** What the composer offers to link. */
export function useSessionRows(api: SendtallyApi): { state: QueryState<SessionRow[]> } {
  return { state: useQuery(queries.sessions(api)).state };
}
