import { describe, expect, it } from "vitest";
import { cleanDone, doneSummary, exerciseNames, setText } from "./done";

describe("done", () => {
  it("counts the items and sets done, or nothing when none were", () => {
    expect(
      doneSummary([
        { item: 0, exercise: "Squat", sets: [{ reps: 5 }, { reps: 5 }] },
        { item: 1, exercise: "Plank", sets: [{ onS: 60 }] },
        { item: 2, exercise: "Dips", sets: [] },
      ])
    ).toBe("2 exercises · 3 sets");
    expect(doneSummary([{ item: 0, exercise: "Dips", sets: [] }])).toBeNull();
  });

  it("describes a set by what it has", () => {
    expect(setText({ reps: 5, weightKg: 100 }, "kg")).toBe("5 × 100 kg");
    expect(setText({ onS: 30 }, "kg")).toBe("30s");
    expect(setText({}, "kg")).toBe("");
  });

  it("saves named items only, and lists names newest first, each once", () => {
    expect(
      cleanDone([
        { item: 0, exercise: " Squat ", sets: [] },
        { item: 1, exercise: " ", sets: [] },
      ])
    ).toEqual([{ item: 0, exercise: "Squat", sets: [] }]);
    expect(
      exerciseNames([
        { done: [{ item: 0, exercise: "Squat", sets: [] }] },
        {
          done: [
            { item: 0, exercise: "squat", sets: [] },
            { item: 1, exercise: "Dips", sets: [] },
          ],
        },
      ])
    ).toEqual(["Squat", "Dips"]);
  });
});
