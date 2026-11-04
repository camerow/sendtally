import {
  PERSISTER_KEY_PREFIX,
  experimental_createQueryPersister,
} from "@tanstack/query-persist-client-core";
import type { Query, QueryClient } from "@tanstack/react-query";
import { worthPersisting } from "./queries";

/** One small file per cached read, named by its key. */
export type QueryFiles = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => void;
  remove: (key: string) => void;
};

const persisted = (query: Query): boolean => worthPersisting(query.queryKey);
const fileOf = (query: Query): string => `${PERSISTER_KEY_PREFIX}-${query.queryHash}`;

/**
 * Each read is restored from its own file the first time a screen asks for it, and written back
 * alone when it changes, so a save never serializes the whole cache. Reads run offline-first so a
 * cold start without a connection still restores. A write made on the phone is saved too, and a
 * read dropped from memory takes its file with it.
 */
export function persistQueries(client: QueryClient, files: QueryFiles, buster: string): () => void {
  const persister = experimental_createQueryPersister({
    storage: { getItem: files.read, setItem: files.write, removeItem: files.remove },
    buster,
    maxAge: Infinity,
    filters: { predicate: persisted },
  });
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, persister: persister.persisterFn, networkMode: "offlineFirst" },
  });
  return client.getQueryCache().subscribe((event) => {
    if (!persisted(event.query)) return;
    if (event.type === "removed") files.remove(fileOf(event.query));
    else if (event.type === "updated" && event.action.type === "success" && event.action.manual) {
      void persister.persistQuery(event.query);
    }
  });
}
