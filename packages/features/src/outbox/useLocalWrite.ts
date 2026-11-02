import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { OutboxKind } from "./outbox";
import { useOutbox } from "./OutboxProvider";

type Methods = {
  [M in keyof SendtallyApi]: SendtallyApi[M] extends (...args: never[]) => Promise<unknown>
    ? M
    : never;
}[keyof SendtallyApi];

/** The server half of a local write: which row, and the API call that saves it. */
export type LocalOp<M extends Methods = Methods> = {
  key: string;
  kind?: OutboxKind;
  method: M;
  args: Parameters<SendtallyApi[M]>;
};

/** One cached read a local write changes. */
export type CachePatch = { queryKey: QueryKey; update: (data: unknown) => unknown };

/** Changes a read already cached; one not yet read is left for its first fetch. */
export const patch = <T>(queryKey: QueryKey, update: (data: T) => T): CachePatch => ({
  queryKey,
  update: (data) => (data === undefined ? data : update(data as T)),
});

/** Sets a read outright, so a row made on the phone opens before the server has it. */
export const put = <T>(queryKey: QueryKey, value: T): CachePatch => ({
  queryKey,
  update: () => value,
});

export type LocalWrite = <M extends Methods>(op: LocalOp<M>, ...patches: CachePatch[]) => void;

/**
 * Patches the cache and saves the op to the outbox, both before returning; the network is never
 * on the path that keeps what the user did. The cache is patched before a fetch in flight is
 * cancelled, so a screen opened right after reads the write.
 */
export function useLocalWrite(): LocalWrite {
  const client = useQueryClient();
  const outbox = useOutbox();
  return React.useCallback(
    ({ kind = "update", ...op }, ...patches) => {
      for (const { queryKey, update } of patches) {
        client.setQueryData(queryKey, update);
        void client.cancelQueries({ queryKey }, { revert: false });
      }
      outbox.add({ ...op, kind, args: [...op.args], holds: patches.map((p) => p.queryKey) });
    },
    [client, outbox]
  );
}
