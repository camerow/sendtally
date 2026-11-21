import {
  PERSISTER_KEY_PREFIX,
  experimental_createQueryPersister,
} from "@tanstack/query-persist-client-core";
import {
  noop,
  notifyManager,
  type Query,
  type QueryClient,
  type QueryFunctionContext,
  type QueryKey,
} from "@tanstack/react-query";
import { worthPersisting } from "./queries";

/** One small file per cached read, named by its key. */
export type QueryFiles = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => void;
  remove: (key: string) => void;
};

const persisted = (query: Query): boolean => worthPersisting(query.queryKey);
const fileOf = (query: Query): string => `${PERSISTER_KEY_PREFIX}-${query.queryHash}`;

type Restore = ReturnType<typeof experimental_createQueryPersister>["persisterFn"];

/**
 * A restored read that has gone stale is refetched here rather than by the library, whose own
 * refetch has nothing catching it, so every read restored without a connection was an unhandled
 * rejection. The failure still lands on the query, which is where the screens read it.
 */
const refetchingWhenStale =
  (restore: Restore) =>
  async <T, K extends QueryKey>(
    queryFn: (context: QueryFunctionContext<K>) => T | Promise<T>,
    context: QueryFunctionContext<K>,
    query: Query
  ): Promise<T> => {
    let asked = false;
    const ask = (c: QueryFunctionContext<K>): T | Promise<T> => {
      asked = true;
      return queryFn(c);
    };
    const data = await restore(ask, context, query);
    if (!asked) {
      notifyManager.schedule(() => {
        if (query.isStale()) query.fetch().catch(noop);
      });
    }
    return data;
  };

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
    refetchOnRestore: false,
    filters: { predicate: persisted },
  });
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({
    ...defaults,
    queries: {
      ...defaults.queries,
      persister: refetchingWhenStale(persister.persisterFn),
      networkMode: "offlineFirst",
    },
  });
  return client.getQueryCache().subscribe((event) => {
    if (!persisted(event.query)) return;
    if (event.type === "removed") files.remove(fileOf(event.query));
    else if (event.type === "updated" && event.action.type === "success" && event.action.manual) {
      void persister.persistQuery(event.query);
    }
  });
}
