import { liveStoredDraft, type DraftStorage } from "@sendtally/features/log-session";

/** What is live now, and the ways out of it. */
export type Running = {
  name: string;
  resume: () => void;
  record: () => void;
  discard: () => void;
};

/** Something asked to start while another runs. */
export type Asking = { running: Running; start: () => void };

export const LIVE_PATH = "/app/sessions/live";

/**
 * The live climbing session, if one runs.
 * ponytail: climbing only; #288 adds the players' runs here and in the LiveBar.
 */
export function running(storage: DraftStorage, go: (to: string) => void): Running | null {
  const session = liveStoredDraft(storage, new Date());
  if (session === null) return null;
  return {
    name: session.draft.name,
    resume: () => go(LIVE_PATH),
    record: () => go(`${LIVE_PATH}?finish=1`),
    discard: () => storage.remove(),
  };
}

let asking: Asking | null = null;
let afterRecord: (() => void) | null = null;
const listeners = new Set<() => void>();

const setAsking = (next: Asking | null): void => {
  asking = next;
  listeners.forEach((l) => l());
};

export const askingStore = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  read: (): Asking | null => asking,
  close: (): void => setAsking(null),
  /** Records the running one; the new one starts once it is saved or thrown away. */
  record: (a: Asking): void => {
    afterRecord = a.start;
    setAsking(null);
    a.running.record();
  },
  /** Nothing runs any more: what waited on a record starts. */
  settled: (): void => {
    const start = afterRecord;
    afterRecord = null;
    start?.();
  },
};

/** Starts a run, unless something already runs: then the climber picks what happens to it first. */
export function startLive(current: Running | null, start: () => void): void {
  if (current === null) start();
  else setAsking({ running: current, start });
}
