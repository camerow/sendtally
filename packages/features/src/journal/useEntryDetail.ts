import React from "react";
import type { EntryDetail, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";

export type EntryDetailData = { entry: EntryDetail; sessions: SessionRow[] };

/** An entry page reads the whole log alongside it: linked sessions, and the ones its dates cover. */
export function useEntryDetail(
  api: SendtallyApi,
  id: string
): { state: QueryState<EntryDetailData>; reload: () => void } {
  const load = React.useCallback(async (): Promise<EntryDetailData> => {
    const [{ entry }, { sessions }] = await Promise.all([api.entry(id), api.sessions()]);
    return { entry, sessions };
  }, [api, id]);
  return useQuery(load);
}

/** What the composer offers to link. */
export function useSessionRows(api: SendtallyApi): { state: QueryState<SessionRow[]> } {
  const load = React.useCallback(async (): Promise<SessionRow[]> => {
    const { sessions } = await api.sessions();
    return sessions;
  }, [api]);
  return { state: useQuery(load).state };
}
