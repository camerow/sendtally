import type { JournalEntry, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

export function useEntries(api: SendtallyApi): Query<JournalEntry[]> {
  return useQuery(queries.entries(api));
}
