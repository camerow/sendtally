import React from "react";
import type { JournalEntry, SendtallyApi } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";

export function useEntries(api: SendtallyApi): {
  state: QueryState<JournalEntry[]>;
  reload: () => void;
} {
  const load = React.useCallback(async (): Promise<JournalEntry[]> => {
    const { entries } = await api.entries();
    return entries;
  }, [api]);
  const { state, reload } = useQuery(load);
  return { state, reload };
}
