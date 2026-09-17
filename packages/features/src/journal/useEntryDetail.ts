import React from "react";
import type { EntryDetail, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { queries, useQuery, useQueryPair, type QueryState } from "../query";

export type EntryDetailData = { entry: EntryDetail; sessions: SessionRow[] };

/** An entry page reads the whole log alongside it: linked sessions, and the ones its dates cover. */
export function useEntryDetail(
  api: SendtallyApi,
  id: string
): { state: QueryState<EntryDetailData> } {
  const { state: loaded } = useQueryPair(queries.entry(api, id), queries.sessions(api));
  const state = React.useMemo(
    (): QueryState<EntryDetailData> =>
      loaded.status === "ready"
        ? { status: "ready", data: { entry: loaded.data[0], sessions: loaded.data[1] } }
        : loaded,
    [loaded]
  );
  return { state };
}

/** What the composer offers to link. */
export function useSessionRows(api: SendtallyApi): { state: QueryState<SessionRow[]> } {
  return { state: useQuery(queries.sessions(api)).state };
}
