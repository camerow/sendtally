import { describe, expect, it, vi } from "vitest";
import { startRun, tick } from "@sendtally/core/hang";
import type { Hold } from "./holdClock";
import {
  holdCues,
  liveRunStore,
  liveRunSummary,
  parseLiveRun,
  type LiveRun,
  type RunState,
  type RunStorage,
} from "./liveRun";
import type { Rest } from "./restCountdown";

const live = (state: RunState): LiveRun => ({
  title: "Max hangs",
  workoutId: "w1",
  pathname: "/workout/timer",
  params: {},
  startedAt: 0,
  state,
});

const run = tick(
  startRun(
    { name: "Max hangs", kind: "hang", hangS: 10, restS: 3, reps: 2, sets: 5, setRestS: 180 },
    0
  ),
  6_000
);

describe("a live run", () => {
  it("survives being read back from disk", () => {
    const stored = live({ player: "timer", run });
    expect(parseLiveRun(JSON.stringify(stored))).toEqual(stored);
    expect(parseLiveRun("{")).toBeNull();
    expect(parseLiveRun(JSON.stringify({ ...stored, pathname: "/elsewhere" }))).toBeNull();
  });

  it("says where each player is", () => {
    expect(liveRunSummary(live({ player: "timer", run }))).toBe("Set 1 of 5 · Hang");
    expect(liveRunSummary(live({ player: "timer", run, laps: true }))).toBe("Lap 1 of 5 · Climb");
    expect(
      liveRunSummary(
        live({
          player: "sets",
          done: [{ item: 0, exercise: "Ring row", sets: [{ reps: 8 }, { reps: 8 }] }],
          ticked: ["0:0"],
        })
      )
    ).toBe("Ring row · Set 2 of 2");
    expect(liveRunSummary(live({ player: "checklist", ticked: [0], count: 3 }))).toBe(
      "1 of 3 done"
    );
  });
});

function memory(): RunStorage & { value: string | null } {
  const s = {
    value: null as string | null,
    read: () => s.value,
    write: (v: string) => {
      s.value = v;
    },
    remove: () => {
      s.value = null;
    },
    subscribe: () => () => undefined,
  };
  return s;
}

describe("the live run store", () => {
  const rest = { at: "0:0", next: null, seconds: 90, endsAt: 1000 } as unknown as Rest;

  it("keeps the running rest when a player saves its place", () => {
    const store = liveRunStore(memory(), { remove: () => undefined });
    const sets = live({ player: "sets", done: [], ticked: [] });
    store.write({ ...sets, pathname: "/workout/sets" });
    store.writeRest(rest);
    store.write({ ...sets, pathname: "/workout/sets", state: { ...sets.state } });
    expect(store.read()?.rest).toEqual(rest);
    store.writeRest(null);
    expect(store.read()?.rest).toBeUndefined();
  });

  it("finds the run only for its own player and workout", () => {
    const store = liveRunStore(memory(), { remove: () => undefined });
    store.write(live({ player: "checklist", ticked: [], count: 2 }));
    expect(store.resumed("/workout/timer", "w1")).not.toBeNull();
    expect(store.resumed("/workout/timer", "w2")).toBeNull();
    expect(store.resumed("/workout/sets", "w1")).toBeNull();
  });

  it("clears the run and its tally together", () => {
    const tally = { remove: vi.fn() };
    const storage = memory();
    const store = liveRunStore(storage, tally);
    store.write(live({ player: "checklist", ticked: [], count: 2 }));
    store.clear();
    expect(storage.value).toBeNull();
    expect(tally.remove).toHaveBeenCalledOnce();
  });
});

describe("hold cues", () => {
  it("counts in, then marks each side's start and end", () => {
    const hold = {
      at: "0:0",
      name: "Plank",
      targetS: 10,
      sides: true,
      zeroAt: 10_000,
      pausedAt: null,
    } as Hold;
    expect(holdCues(hold).map((c) => [c.at, c.sound])).toEqual([
      [7_000, "tick"],
      [8_000, "tick"],
      [9_000, "tick"],
      [10_000, "work"],
      [20_000, "rest"],
      [25_000, "work"],
      [35_000, "rest"],
    ]);
  });
});
