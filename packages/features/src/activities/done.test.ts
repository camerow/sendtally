import { describe, expect, it } from "vitest";
import {
  addSet,
  changeSet,
  cleanDone,
  doneSummary,
  exerciseNames,
  isChecklist,
  previousSets,
  removeSet,
  setChip,
  setText,
  setsLine,
} from "./done";

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

  it("takes an exercise's sets from the newest run of the same workout that did it", () => {
    const run = (workoutId: string | null, sets: { reps: number; weightKg: number }[]) => ({
      workoutId,
      done: [{ item: 0, exercise: "Squat", sets }],
    });
    const newestFirst = [
      run("other", [{ reps: 3, weightKg: 140 }]),
      run("w1", []),
      run("w1", [
        { reps: 5, weightKg: 100 },
        { reps: 4, weightKg: 100 },
      ]),
      run("w1", [{ reps: 5, weightKg: 95 }]),
    ];
    expect(previousSets(newestFirst, "w1", "Squat")).toEqual([
      { reps: 5, weightKg: 100 },
      { reps: 4, weightKg: 100 },
    ]);
    expect(previousSets(newestFirst, "w1", "Bench")).toEqual([]);
  });

  it("chips a set without its unit, and an empty or zero weight as reps alone", () => {
    expect(setChip({ reps: 5, weightKg: 100 }, "kg")).toBe("5 × 100");
    expect(setChip({ reps: 8 }, "kg")).toBe("8");
    expect(setChip({ reps: 8, weightKg: 0 }, "kg")).toBe("8");
    expect(setChip({ onS: 60 }, "kg")).toBe("60s");
    expect(setsLine([{ onS: 60 }, { onS: 60 }], "kg")).toBe("2 × 60s");
    expect(setsLine([{ onS: 90 }], "kg")).toBe("90s");
    expect(setsLine([{ onS: 60 }, { onS: 45 }], "kg")).toBe("60s, 45s");
    expect(setsLine([{}, {}], "kg")).toBe("");
  });

  it("reads as a checklist when nothing done has reps or a weight", () => {
    expect(isChecklist([{ item: 0, exercise: "Pigeon", sets: [{ onS: 60 }, {}] }])).toBe(true);
    expect(isChecklist([{ item: 0, exercise: "Squat", sets: [{ reps: 5 }] }])).toBe(false);
  });

  it("changes, copies and removes sets, and drops an exercise with its last set", () => {
    const done = [
      { item: 0, exercise: "Squat", sets: [{ reps: 5, weightKg: 100 }] },
      { item: 1, exercise: "Dips", sets: [{ reps: 8 }, { reps: 6 }] },
    ];
    expect(changeSet(done, 1, 1, { reps: 7 })[1]?.sets).toEqual([{ reps: 8 }, { reps: 7 }]);
    expect(addSet(done, 0)[0]?.sets).toEqual([
      { reps: 5, weightKg: 100 },
      { reps: 5, weightKg: 100 },
    ]);
    expect(removeSet(done, 1, 0)[1]?.sets).toEqual([{ reps: 6 }]);
    expect(removeSet(done, 0, 0).map((d) => d.exercise)).toEqual(["Dips"]);
  });
});
