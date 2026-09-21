import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  ApiError,
  type CreationRef,
  type CreationResult,
  type ModerationCreations,
  type ModerationQueue,
  type SendtallyApi,
} from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

export function useModerationQueue(api: SendtallyApi): Query<ModerationQueue> {
  return useQuery(queries.moderation(api));
}

export function useModerationCreations(api: SendtallyApi): Query<ModerationCreations> {
  return useQuery(queries.moderationCreations(api));
}

// The API takes this many at once, so a bigger selection goes as several requests, in order.
const BULK_CHUNK = 20;

/** Runs `send` over the refs a chunk at a time and gathers every item's own result. */
export async function inChunks(
  refs: CreationRef[],
  send: (chunk: CreationRef[]) => Promise<CreationResult[]>
): Promise<CreationResult[]> {
  const results: CreationResult[] = [];
  for (let at = 0; at < refs.length; at += BULK_CHUNK) {
    results.push(...(await send(refs.slice(at, at + BULK_CHUNK))));
  }
  return results;
}

export type ModerationAction = {
  busy: boolean;
  error: string | null;
  /** `conflict` replaces the default message for a 409 whose cause the caller knows better. */
  run: (action: () => Promise<unknown>, conflict?: string) => Promise<void>;
};

/**
 * One moderation button press. A success refreshes the queue through the write hook;
 * a 409 means someone else got there first, so the queue is refetched to show what changed.
 */
export function useModerationAction(): ModerationAction {
  const client = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = React.useCallback(
    async (action: () => Promise<unknown>, conflictMessage?: string): Promise<void> => {
      setBusy(true);
      setError(null);
      try {
        await action();
      } catch (e) {
        const conflict = e instanceof ApiError && e.status === 409;
        setError(
          conflict
            ? (conflictMessage ?? "It changed while you were reviewing. Check the updated version.")
            : "Something went wrong. Try again."
        );
        if (conflict) await client.invalidateQueries({ queryKey: ["moderation"] });
      } finally {
        setBusy(false);
      }
    },
    [client]
  );
  return { busy, error, run };
}
