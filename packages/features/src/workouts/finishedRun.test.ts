import { describe, expect, it } from "vitest";
import { finishedRun, type HeldRun } from "./finishedRun";
import { runParams } from "./runParams";

const params = runParams({
  kind: "strength",
  title: "Core",
  date: "2026-11-16",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  session: 0,
  minutes: null,
  exerciseRestS: 0,
  items: [{ exercise: "Plank", dose: { sets: 2, onS: 30 } }],
});
const hold = { at: "0:0", name: "Plank", targetS: 30, sides: false, zeroAt: 0, pausedAt: null };

describe("a hold that ends while its player is minimised", () => {
  it("ticks its set then, which is when the run last ticked", () => {
    const live: HeldRun = {
      params,
      state: { player: "sets", done: [{ item: 0, exercise: "Plank", sets: [{}, {}] }], ticked: [] },
      hold,
    };
    const after = finishedRun(live, 30, 90_000);
    expect(after.state).toMatchObject({ ticked: ["0:0"] });
    expect(after.lastTickAt).toBe(90_000);
  });
});
