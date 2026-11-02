import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { Outbox } from "./outbox";

const outboxes = new WeakMap<QueryClient, Outbox>();

export function attachOutbox(client: QueryClient, outbox: Outbox): () => void {
  outboxes.set(client, outbox);
  return () => outboxes.delete(client);
}

/**
 * A read that answers from its own cache while unsent ops have patched it, so a refetch on
 * focus or reconnect never lays the server's older copy over what the user just did. The
 * outbox reads it again once those ops are sent.
 */
export function whileQueued<T>(
  fetch: () => Promise<T>
): (context: { client: QueryClient; queryKey: QueryKey }) => Promise<T> {
  return async ({ client, queryKey }) => {
    const cached = client.getQueryData<T>(queryKey);
    return cached !== undefined && outboxes.get(client)?.holds(queryKey) === true
      ? cached
      : fetch();
  };
}
