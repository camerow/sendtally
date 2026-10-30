import { router } from "expo-router";
import { liveStoredDraft } from "@sendtally/features/log-session";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { clearLiveRun, liveRunHref, readLiveRun } from "./liveRun";

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
export type Asking = { running: Running; next: string; start: () => void };

export function running(): Running | null {
  const session = liveStoredDraft(liveSessionStorage, new Date());
  if (session !== null)
    return {
      name: session.draft.name,
      climbing: true,
      resume: () => router.push("/session/live"),
      record: () => router.push({ pathname: "/session/live", params: { finish: "1" } }),
      discard: () => liveSessionStorage.remove(),
    };
  const run = readLiveRun();
  if (run === null) return null;
  return {
    name: run.title,
    climbing: false,
    resume: () => router.push(liveRunHref(run)),
    record: () => router.push(liveRunHref(run, true)),
    discard: clearLiveRun,
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

/** Starts `next`, unless something already runs: then the climber picks what happens to it first. */
export function startLive(next: string, start: () => void): void {
  const current = running();
  if (current === null) start();
  else setAsking({ running: current, next, start });
}
