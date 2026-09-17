import React from "react";
import type { EntryDetail, JournalEntry, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { queries, useQuery, useQueryPair, type QueryState } from "../query";

export type LogRows = { sessions: SessionRow[]; entries: JournalEntry[] };

export type EntryDetailData = LogRows & { entry: EntryDetail };

/** The whole log: what an entry links, and what a trip's dates take in. */
export function useLogRows(api: SendtallyApi): { state: QueryState<LogRows> } {
  const { state: loaded } = useQueryPair(queries.sessions(api), queries.entries(api));
  const state = React.useMemo(
    (): QueryState<LogRows> =>
      loaded.status === "ready"
        ? { status: "ready", data: { sessions: loaded.data[0], entries: loaded.data[1] } }
        : loaded,
    [loaded]
  );
  return { state };
}

/** An entry page reads the whole log alongside it. */
export function useEntryDetail(
  api: SendtallyApi,
  id: string
): { state: QueryState<EntryDetailData> } {
  const { state: entry } = useQuery(queries.entry(api, id));
  const { state: log } = useLogRows(api);
  const state = React.useMemo((): QueryState<EntryDetailData> => {
    if (entry.status !== "ready") return entry;
    if (log.status !== "ready") return log;
    return { status: "ready", data: { entry: entry.data, ...log.data } };
  }, [entry, log]);
  return { state };
}
