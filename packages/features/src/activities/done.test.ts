import { describe, expect, it } from "vitest";
import {
  addSet,
  changeSet,
  cleanDone,
  doneSummary,
  exerciseNames,
  fromTimerNote,
  keptSets,
  offWithout,
  runStatus,
  setCounts,
  shortOf,
  previousSets,
  removeSet,
  setChip,
  setText,
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
  });

  it("saves only the sets left ticked, dropping an exercise with every set off", () => {
    const done = [
      { item: 0, exercise: "Pull-up", sets: [{ reps: 8 }, { reps: 8 }] },
      { item: 1, exercise: "Dead hang", sets: [{ onS: 45 }] },
      { item: 2, exercise: "Plank", sets: [] },
    ];
    expect(keptSets(done, ["0:1", "1:0"])).toEqual([
      { item: 0, exercise: "Pull-up", sets: [{ reps: 8 }] },
      { item: 2, exercise: "Plank", sets: [] },
    ]);
    expect(offWithout(["0:0", "0:2", "0:3", "1:2"], 0, 2)).toEqual(["0:0", "0:2", "1:2"]);
  });

  it("reads a set short of its dose as how much of it was done", () => {
    expect(shortOf({ reps: 4, onS: 10 }, { reps: 6, onS: 10 })).toBe("4 of 6");
    expect(shortOf({ onS: 30 }, { onS: 45 })).toBe("0:30 of 0:45");
    expect(shortOf({ reps: 8 }, { reps: 8 })).toBeNull();
    expect(shortOf({ reps: 4 }, undefined)).toBeNull();
  });

  it("tells what the timer saw: sets full, partial and not done, and where it fell short", () => {
    const done = [{ item: 0, exercise: "half", sets: [6, 6, 6, 4, 6].map((reps) => ({ reps })) }];
    const counts = setCounts(done, ["0:4"], [{ reps: 6 }]);
    expect(counts).toEqual({ full: 3, partial: 1, off: 1, total: 5, firstShort: 3 });
    expect(fromTimerNote(counts)).toBe(
      "From the timer: 3 sets full, 1 partial, 1 not done. Fix anything before saving."
    );
    expect(runStatus(counts)).toBe("Ended at set 4 of 5");
    expect(runStatus(setCounts(done, [], [{ reps: 4 }]))).toBe("Session complete");
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
