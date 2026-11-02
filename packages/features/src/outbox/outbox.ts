import { partialMatchKey, type QueryKey } from "@tanstack/react-query";
import { ApiError } from "@sendtally/api-client";
import type { DraftStorage } from "../log-session/draftStore";

/** A delete cancels a create that never left the phone, and the row with it. */
export type OutboxKind = "create" | "update" | "delete";

export type OutboxOp = {
  id: number;
  /** The row the op writes. Back-to-back ops on one key coalesce, so each must carry all it saves. */
  key: string;
  kind: OutboxKind;
  /** A `SendtallyApi` method, called with `args` once the network allows. */
  method: string;
  args: unknown[];
  /** The cached reads it patched, kept from refetching over the patch until it is sent. */
  holds: QueryKey[];
};

export type OutboxEntry = Omit<OutboxOp, "id">;

export type OutboxHooks = {
  run: (op: OutboxOp) => Promise<unknown>;
  isOnline: () => boolean;
  /** The server refused an op for good, so it is gone; what it held is worth reading again. */
  dropped: (op: OutboxOp, error: unknown) => void;
  /** Every op is sent; the reads they held are worth reading again. */
  settled: (holds: QueryKey[]) => void;
};

export type Outbox = {
  /** Saves the op to disk before returning, then sends it when it can. */
  add: (entry: OutboxEntry) => void;
  /** Sends what is waiting, one op at a time, until it runs out or the network fails. */
  drain: () => Promise<void>;
  ops: () => OutboxOp[];
  holds: (queryKey: QueryKey) => boolean;
  clear: () => void;
};

export const OUTBOX_RETRY_MS = [1_000, 5_000, 30_000, 120_000];

const parse = (raw: string | null): OutboxOp[] => {
  try {
    const ops: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(ops) ? (ops as OutboxOp[]) : [];
  } catch {
    return [];
  }
};

/** A 4xx other than 401 is the server's final answer; anything else may go through later. */
const final = (error: unknown): boolean =>
  error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401;

/**
 * Every write the app makes, saved to one file before the network is tried, so nothing the
 * user did waits on or is lost to a connection. Ops go out in order, one at a time. A failure
 * that might pass (offline, 5xx, 429) keeps the op and tries again later; 401 waits for the
 * next drain, which signing in triggers.
 */
export function createOutbox(storage: DraftStorage, hooks: OutboxHooks): Outbox {
  let sending: number | null = null;
  let running: Promise<boolean> | null = null;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const sent: QueryKey[] = [];

  const read = (): OutboxOp[] => parse(storage.read());
  const write = (ops: OutboxOp[]): void => {
    if (ops.length === 0) storage.remove();
    else storage.write(JSON.stringify(ops));
  };
  // By content, not id: the file may belong to another account by the time a request returns.
  const remove = (op: OutboxOp): void => {
    const body = JSON.stringify(op);
    write(read().filter((o) => JSON.stringify(o) !== body));
  };

  const retryLater = (): void => {
    if (timer !== null) return;
    const delay = OUTBOX_RETRY_MS[Math.min(attempt++, OUTBOX_RETRY_MS.length - 1)];
    timer = setTimeout(() => {
      timer = null;
      void drain();
    }, delay);
  };

  /** Resolves true when it stopped on a failure, which the back-off retries. */
  const loop = async (): Promise<boolean> => {
    for (;;) {
      const op = read()[0];
      if (op === undefined) {
        if (sent.length > 0) hooks.settled(sent.splice(0));
        return false;
      }
      if (!hooks.isOnline()) return false;
      sending = op.id;
      try {
        await hooks.run(op);
        attempt = 0;
      } catch (error) {
        if (!final(error)) {
          if (!(error instanceof ApiError && error.status === 401)) retryLater();
          return true;
        }
        remove(op);
        hooks.dropped(op, error);
        continue;
      } finally {
        sending = null;
      }
      remove(op);
      sent.push(...op.holds);
    }
  };

  // A loop already running may have looked before this call's reason to drain, so another
  // follows it, unless it stopped on a failure the back-off already retries.
  const drain = async (): Promise<void> => {
    if (running !== null) {
      if (!(await running)) await drain();
      return;
    }
    running = loop().finally(() => {
      running = null;
    });
    await running;
  };

  return {
    add: (entry) => {
      const ops = read();
      const op = { ...entry, id: (ops.at(-1)?.id ?? 0) + 1 };
      const queued = (o: OutboxOp): boolean => o.key === entry.key && o.id !== sending;
      const last = ops.at(-1);
      if (entry.kind === "delete") {
        const rest = ops.filter((o) => !queued(o));
        write(ops.some((o) => queued(o) && o.kind === "create") ? rest : [...rest, op]);
      } else if (last !== undefined && queued(last) && last.method === entry.method) {
        write([...ops.slice(0, -1), { ...op, kind: last.kind }]);
      } else {
        write([...ops, op]);
      }
      void drain();
    },
    drain,
    ops: read,
    holds: (queryKey) =>
      read().some((o) => o.holds.some((held) => partialMatchKey(queryKey, held))),
    clear: () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      sent.length = 0;
      storage.remove();
    },
  };
}
