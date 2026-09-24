import { focusManager } from "@tanstack/react-query";
import React from "react";
import type { LogSessionInput, SessionDetail } from "@sendtally/api-client";
import { parseStoredDraft, writeStoredDraft, type DraftStorage } from "./draftStore";
import { toLiveSessionInput, toLogSessionInput } from "./transforms";

export type LiveSyncApi = {
  logSession: (input: LogSessionInput) => Promise<{ session: SessionDetail }>;
  updateLoggedSession: (
    fingerprint: string,
    input: LogSessionInput
  ) => Promise<{ session: SessionDetail }>;
  deleteLoggedSession: (fingerprint: string) => Promise<{ deleted: boolean }>;
};

export type LiveSyncStatus = "idle" | "saving" | "failed";

export type LiveSync = {
  /** The stored live draft changed; push it once the edits settle. */
  changed: () => void;
  /** Push again after a failure - the app came back to the foreground. */
  retry: () => void;
  /** The last climb went, and the server session with it. */
  remove: (fingerprint: string) => void;
  /** The screen is going away: push a change still waiting out the debounce now. */
  flush: () => void;
};

export const LIVE_SYNC_DEBOUNCE_MS = 600;

/**
 * Mirrors the stored live draft to the server: a POST until the file carries a fingerprint,
 * a PUT after. Requests run one at a time; a change during one queues exactly one more, which
 * reads the file afresh and so carries every edit made meanwhile.
 */
export function createLiveSync(
  api: LiveSyncApi,
  storage: DraftStorage,
  onStatus: (status: LiveSyncStatus) => void,
  debounceMs = LIVE_SYNC_DEBOUNCE_MS
): LiveSync {
  let chain = Promise.resolve();
  let queued = false;
  let failed = false;
  let pushed: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const status = (next: LiveSyncStatus): void => {
    failed = next === "failed";
    onStatus(next);
  };

  const push = async (): Promise<void> => {
    const stored = parseStoredDraft(storage.read(), new Date());
    if (stored === null) return;
    const serialized = JSON.stringify(stored.draft);
    if (serialized === pushed) return;
    status("saving");
    const input = stored.detailed
      ? toLogSessionInput(stored.draft)
      : toLiveSessionInput(stored.draft);
    if (stored.fingerprint === undefined) {
      const { session } = await api.logSession(input);
      const current = parseStoredDraft(storage.read(), new Date());
      if (current === null) {
        await api.deleteLoggedSession(session.fingerprint);
        pushed = null;
        status("idle");
        return;
      }
      writeStoredDraft(storage, current.draft, new Date(), { fingerprint: session.fingerprint });
    } else {
      await api.updateLoggedSession(stored.fingerprint, input);
    }
    pushed = serialized;
    status("idle");
  };

  const enqueue = (op: () => Promise<void>): void => {
    chain = chain.then(op).catch(() => status("failed"));
  };

  const schedulePush = (): void => {
    if (queued) return;
    queued = true;
    enqueue(async () => {
      queued = false;
      await push();
    });
  };

  const cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  return {
    changed: () => {
      cancel();
      timer = setTimeout(schedulePush, debounceMs);
    },
    retry: () => {
      if (failed) schedulePush();
    },
    remove: (fingerprint) => {
      cancel();
      pushed = null;
      enqueue(() => api.deleteLoggedSession(fingerprint).then(() => status("idle")));
    },
    flush: () => {
      if (timer === null) return;
      cancel();
      schedulePush();
    },
  };
}

export type LiveSyncState = { sync: LiveSync; status: LiveSyncStatus };

/** One sync per screen; a foreground return retries a push that failed. */
export function useLiveSync(api: LiveSyncApi, storage: DraftStorage): LiveSyncState {
  const [status, setStatus] = React.useState<LiveSyncStatus>("idle");
  const [sync] = React.useState(() => createLiveSync(api, storage, setStatus));
  React.useEffect(() => {
    const unsubscribe = focusManager.subscribe((focused) => {
      if (focused) sync.retry();
    });
    return () => {
      unsubscribe();
      sync.flush();
    };
  }, [sync]);
  return { sync, status };
}
