import { describe, expect, it } from "@jest/globals";
import { startRun, tick } from "@sendtally/core/hang";
import { liveRunSummary, parseLiveRun, type LiveRun, type RunState } from "./liveRun";

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
