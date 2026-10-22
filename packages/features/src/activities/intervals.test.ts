import { describe, expect, it } from "vitest";
import type { Intervals } from "@sendtally/core/hang";
import { doneOfRun, intervalsSummary, stepDose } from "./intervals";

const flow: Intervals = {
  rounds: 2,
  steps: [
    { label: "90/90", measure: "time", seconds: 60, restAfter: 10 },
    { label: "Couch stretch", measure: "time", seconds: 45, side: "each", restAfter: 0 },
    { label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 30 },
  ],
};

describe("intervals", () => {
  it("summarises rounds, steps and the time it takes", () => {
    expect(intervalsSummary(flow)).toBe("2 rounds · 3 steps · 7 min");
  });

  it("describes a step's dose", () => {
    expect(stepDose(flow.steps[2]!, "kg")).toBe("× 15 · 24 kg");
    expect(stepDose(flow.steps[1]!, "kg")).toBe("0:45 · each side");
  });

  it("records a run as the sets done per step, with the seconds held when cut short", () => {
    expect(
      doneOfRun(flow, [
        { round: 0, step: 0 },
        { round: 0, step: 2 },
        { round: 1, step: 0, heldSeconds: 20 },
      ])
    ).toEqual([
      { item: 0, exercise: "90/90", sets: [{ onS: 60 }, { onS: 20 }] },
      { item: 1, exercise: "Couch stretch", sets: [] },
      { item: 2, exercise: "Swing", sets: [{ reps: 15, weightKg: 24 }] },
    ]);
  });
});
