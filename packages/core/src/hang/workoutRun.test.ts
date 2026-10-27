import { describe, expect, it } from "vitest";
import {
  endRun,
  GET_READY_S,
  setsDoneByItem,
  startWorkoutRun,
  tick,
  workoutPhases,
  type Protocol,
} from ".";

const hangs: Protocol = {
  name: "Max hangs",
  kind: "hang",
  hangS: 10,
  restS: 0,
  reps: 1,
  sets: 2,
  setRestS: 60,
};
const pulls: Protocol = { ...hangs, kind: "pull", hangS: 0, reps: 3 };

describe("a hangboard workout run", () => {
  it("rests between exercises in place of the next item's Get ready", () => {
    const phases = workoutPhases([hangs, pulls], 180);
    expect(phases.map((p) => [p.kind, p.seconds, p.item])).toEqual([
      ["ready", GET_READY_S, 0],
      ["hang", 10, 0],
      ["setrest", 60, 0],
      ["hang", 10, 0],
      ["ready", 180, 1],
      ["pull", 18, 1],
      ["setrest", 60, 1],
      ["pull", 18, 1],
    ]);
  });

  it("still gets ready between exercises without a rest", () => {
    expect(workoutPhases([hangs, hangs], 0)[4]).toMatchObject({ kind: "ready", seconds: 5 });
  });

  it("plans the work of every item, and counts sets per item", () => {
    const run = startWorkoutRun([hangs, pulls], 180, 0);
    expect(run.planned).toBe(20 + 6);
    // Into the rest between exercises: the first item is done, the second not started.
    const resting = tick(run, (5 + 10 + 60 + 10 + 1) * 1000);
    expect(resting.phases[resting.index]).toMatchObject({ kind: "ready", item: 1 });
    expect(setsDoneByItem(endRun(resting, 86_000), [2, 2])).toEqual([2, 0]);
    expect(setsDoneByItem(endRun(run, 0), [2, 2])).toEqual([0, 0]);
    expect(setsDoneByItem({ ...run, finished: { ended: false, at: 1 } }, [2, 2])).toEqual([2, 2]);
  });
});
