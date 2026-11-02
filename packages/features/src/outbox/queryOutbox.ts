import { onlineManager, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiError, type SendtallyApi } from "@sendtally/api-client";
import type { DraftStorage } from "../log-session/draftStore";
import { createOutbox, type Outbox, type OutboxOp } from "./outbox";

type Method = (...args: unknown[]) => Promise<unknown>;

/** An op names a method rather than holding a closure, so it outlives the process that made it. */
const call = (api: SendtallyApi, op: OutboxOp): Promise<unknown> => {
  const method = (api as unknown as Record<string, unknown>)[op.method];
  return typeof method === "function"
    ? (method as Method).apply(api, op.args)
    : Promise.reject(new ApiError(400, `unknown outbox op ${op.method}`));
};

/**
 * The outbox for an app's query cache: ops go to `api`, and a refused op or a drained queue
 * reads its rows again. A 404 is a row deleted elsewhere, so it goes quietly; any other refusal
 * reaches `onRefused`.
 */
export function queryOutbox(
  storage: DraftStorage,
  api: SendtallyApi,
  client: QueryClient,
  onRefused: (error: unknown) => void
): Outbox {
  const reread = (holds: QueryKey[]): void =>
    holds.forEach((queryKey) => void client.invalidateQueries({ queryKey }));
  return createOutbox(storage, {
    run: (op) => call(api, op),
    isOnline: () => onlineManager.isOnline(),
    dropped: (op, error) => {
      reread(op.holds);
      if (!(error instanceof ApiError && error.status === 404)) onRefused(error);
    },
    settled: reread,
  });
}
