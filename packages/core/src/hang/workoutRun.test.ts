import { describe, expect, it } from "vitest";
import {
  endRun,
  GET_READY_S,
  cameOffEarly,
  setsHeld,
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
    const doses = [
      { sets: 2, reps: 1, onS: 10 },
      { sets: 2, reps: 3 },
    ];
    expect(setsHeld(endRun(resting, 86_000), doses)).toEqual([
      [
        { reps: 1, onS: 10 },
        { reps: 1, onS: 10 },
      ],
      [null, null],
    ]);
    expect(setsHeld(endRun(run, 0), doses)).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it("keeps the seconds of a lone hang cut short, and the hangs held of a set cut short", () => {
    const into = tick(startWorkoutRun([hangs], 0, 0), (5 + 4) * 1000);
    expect(setsHeld(cameOffEarly(into, 9_000), [{ sets: 2, reps: 1, onS: 10 }])).toEqual([
      [{ reps: 1, onS: 4 }, null],
    ]);
    const repeaters = { ...hangs, reps: 3, restS: 5 };
    const second = tick(startWorkoutRun([repeaters], 0, 0), (5 + 10 + 5 + 2) * 1000);
    expect(setsHeld(cameOffEarly(second, 22_000), [{ sets: 2, reps: 3, onS: 10 }])).toEqual([
      [{ reps: 1, onS: 10 }, null],
    ]);
  });
});
