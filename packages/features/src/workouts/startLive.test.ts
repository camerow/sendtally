import { describe, expect, it, vi } from "vitest";
import type { DraftStorage } from "../log-session/draftStore";
import { tallyDraft } from "../log-session/tally";
import { writeStoredDraft } from "../log-session/draftStore";
import { liveRunStore, type LiveRun, type RunStorage } from "./liveRun";
import { askingStore, runningNow, startLive } from "./startLive";

const memory = (): RunStorage & DraftStorage => {
  let value: string | null = null;
  return {
    read: () => value,
    write: (v: string) => {
      value = v;
      return true;
    },
    remove: () => {
      value = null;
    },
    subscribe: () => () => undefined,
    changed: () => undefined,
  };
};

const run: LiveRun = {
  title: "Lower body A",
  workoutId: "w1",
  pathname: "/workout/sets",
  params: { title: "Lower body A" },
  startedAt: 0,
  state: { player: "sets", done: [], ticked: [] },
};

describe("what runs now", () => {
  it("is nothing when neither a session nor a run is live", () => {
    expect(runningNow(memory(), liveRunStore(memory(), memory()), vi.fn())).toBeNull();
  });

  it("opens, records and discards the live run", () => {
    const store = liveRunStore(memory(), memory());
    store.write(run);
    const open = vi.fn();
    const now = runningNow(memory(), store, open);
    expect(now?.name).toBe("Lower body A");
    expect(now?.climbing).toBe(false);
    now?.record();
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ title: "Lower body A" }), true);
    now?.discard();
    expect(store.read()).toBeNull();
  });

  it("puts the climbing session ahead of a run", () => {
    const session = memory();
    void writeStoredDraft(session, tallyDraft(new Date()), new Date(), undefined);
    const store = liveRunStore(memory(), memory());
    store.write(run);
    const open = vi.fn();
    const now = runningNow(session, store, open);
    expect(now?.climbing).toBe(true);
    now?.resume();
    expect(open).toHaveBeenCalledWith(null, false);
  });

  it("asks before starting over something live, and starts what waited once it is recorded", () => {
    const start = vi.fn();
    const record = vi.fn();
    startLive(null, start);
    expect(start).toHaveBeenCalledTimes(1);
    const running = { name: "x", climbing: false, resume: vi.fn(), record, discard: vi.fn() };
    startLive(running, start);
    const asking = askingStore.read();
    expect(asking?.running).toBe(running);
    if (asking !== null) askingStore.record(asking);
    expect(record).toHaveBeenCalled();
    expect(askingStore.waiting()).toBe(true);
    askingStore.settled();
    expect(askingStore.waiting()).toBe(false);
    expect(start).toHaveBeenCalledTimes(2);
  });
});
