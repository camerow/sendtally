import type { DraftStorage } from "../log-session/draftStore";
import { liveStoredDraft } from "../log-session/liveSession";
import type { LiveRun, LiveRunStore } from "./liveRun";

/** What is live now, a climbing session or a workout, and the ways out of it. */
export type Running = {
  name: string;
  /** A climbing session, whose discard drops its climbs, or a workout. */
  climbing: boolean;
  resume: () => void;
  record: () => void;
  discard: () => void;
};

/** Something asked to start while another runs. */
export type Asking = { running: Running; start: () => void };

/**
 * The climbing session running, else the workout run. `open` opens the session (null) or the
 * run, finishing it on the way when `finish` is set.
 */
export function runningNow(
  session: DraftStorage,
  store: LiveRunStore,
  open: (run: LiveRun | null, finish: boolean) => void
): Running | null {
  const draft = liveStoredDraft(session, new Date());
  if (draft !== null)
    return {
      name: draft.draft.name,
      climbing: true,
      resume: () => open(null, false),
      record: () => open(null, true),
      discard: () => session.remove(),
    };
  const run = store.read();
  if (run === null) return null;
  return {
    name: run.title,
    climbing: false,
    resume: () => open(run, false),
    record: () => open(run, true),
    discard: () => store.clear(),
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
  /** Something waits on the running one being saved or thrown away, and opens once it is. */
  waiting: (): boolean => afterRecord !== null,
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
