import { describe, expect, it } from "vitest";
import {
  foldedLine,
  addSet,
  withRpe,
  changeSet,
  cleanDone,
  doneSummary,
  exerciseNames,
  keptSets,
  offWithout,
  plannedDoses,
  exerciseCountText,
  withLineToggled,
  workoutItemsOfDone,
  setsCountText,
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
    expect(setChip({ reps: 8, weightKg: 60 }, "kg", 12)).toBe("8-12 × 60");
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
    expect(shortOf({ reps: 4, onS: 10 }, { reps: 6, onS: 10 }, "hangs")).toBe("4 of 6 hangs");
    expect(shortOf({ reps: 6 }, { reps: 8 })).toBe("6 of 8 reps");
    expect(shortOf({ reps: 8 }, { reps: 40 }, "laps")).toBe("8 of 40 moves");
    expect(setsCountText(2)).toBe("2 sets");
    expect(setsCountText(2, "laps")).toBe("2 laps");
    expect(setsCountText(1, "laps")).toBe("1 lap");
    expect(shortOf({ onS: 30 }, { onS: 45 })).toBe("0:30 of 0:45");
    expect(shortOf({ reps: 8 }, { reps: 8 })).toBeNull();
    expect(shortOf({ reps: 4 }, undefined)).toBeNull();
  });

  it("rates a set 1 to 10 and clears it at zero", () => {
    expect(withRpe({ reps: 5 }, 8)).toEqual({ reps: 5, rpe: 8 });
    expect(withRpe({ reps: 5, rpe: 8 }, 12)).toEqual({ reps: 5, rpe: 10 });
    expect(withRpe({ reps: 5, rpe: 8 }, 0)).toEqual({ reps: 5 });
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
    expect(
      addSet([{ item: 0, exercise: "Squat", sets: [{ reps: 5, rpe: 8 }] }], 0)[0]?.sets
    ).toEqual([{ reps: 5, rpe: 8 }, { reps: 5 }]);
    expect(removeSet(done, 0, 0).map((d) => d.exercise)).toEqual(["Dips"]);
  });
});

describe("a finished exercise folded to one line", () => {
  it("reads its sets, reps and top load", () => {
    const sets = [
      { reps: 5, weightKg: 60 },
      { reps: 5, weightKg: 62.5 },
    ];
    expect(foldedLine(sets, "kg")).toBe("2 sets × 5 reps · 62.5 kg");
  });

  it("reads timed sets by their time, and bare sets by their count", () => {
    expect(foldedLine([{ onS: 45 }, { onS: 45 }, { onS: 45 }], "kg")).toBe("3 sets × 0:45");
    expect(foldedLine([{}], "kg")).toBe("1 set");
  });
});

describe("what each logged exercise was asked", () => {
  it("finds its dose by the exercise, not its place, once a run reorders or leaves items out", () => {
    const planned = [
      { exercise: "half", dose: { sets: 3, reps: 6, onS: 7 } },
      { exercise: "Pull-ups", dose: { sets: 3, reps: 8 } },
    ];
    const done = [{ item: 0, exercise: "Pull-ups", sets: [{ reps: 8 }] }];
    expect(plannedDoses(planned, done)).toEqual([{ sets: 3, reps: 8 }]);
    const inPlace = [{ item: 1, exercise: "Pull-ups", sets: [] }];
    expect(plannedDoses(planned, inPlace)[1]).toEqual({ sets: 3, reps: 8 });
  });
});

describe("an exercise's count in the review", () => {
  it("counts its sets, or says it was not started when none is ticked", () => {
    const d = { item: 1, exercise: "Volume climbing", sets: [{ onS: 600 }, { onS: 600 }] };
    expect(exerciseCountText(d, [], "sets")).toBe("2 sets");
    expect(exerciseCountText(d, ["1:0"], "sets")).toBe("2 sets");
    expect(exerciseCountText(d, ["1:0", "1:1"], "sets")).toBe("Not started");
    expect(exerciseCountText({ ...d, sets: [] }, [], "laps")).toBe("Not started");
  });
});

describe("a checklist in the review", () => {
  const lines = ["Jog", "Arm circles", "Easy boulders"];
  const list = { item: 0, exercise: "Checklist", sets: [], checklist: { lines, checked: [0] } };
  it("ticks or unticks a line, and saves only with a line ticked", () => {
    const two = withLineToggled([list], 0, 2);
    expect(two[0]?.checklist?.checked).toEqual([0, 2]);
    const none = withLineToggled([list], 0, 0);
    expect(none[0]?.checklist?.checked).toEqual([]);
    expect(keptSets(two, [])).toHaveLength(1);
    expect(keptSets(none, [])).toEqual([]);
  });
  it("says how much of a checklist was ticked in the log row, beside the exercises", () => {
    const squat = { item: 1, exercise: "Back squat", sets: [{ reps: 5 }, { reps: 5 }] };
    expect(doneSummary([list, squat])).toBe("Checklist · 1 of 3 · 1 exercise · 2 sets");
    expect(doneSummary([list])).toBe("Checklist · 1 of 3");
    const cool = {
      item: 2,
      exercise: "Checklist",
      sets: [],
      checklist: { lines: ["Hang", "Stretch"], checked: [0, 1] },
    };
    expect(doneSummary([list, squat, cool])).toBe("Checklist · 3 of 5 · 1 exercise · 2 sets");
  });
  it("runs again as a workout with its checklist whole, beside each exercise's first set", () => {
    const squat = { item: 1, exercise: "Back squat", sets: [{ reps: 5 }, { reps: 5 }] };
    expect(workoutItemsOfDone([list, squat, { item: 2, exercise: "Row", sets: [] }])).toEqual([
      { exercise: "Checklist", doses: [{ sets: 1 }], checklist: { lines } },
      { exercise: "Back squat", doses: [{ reps: 5, sets: 2 }] },
    ]);
  });
  it("never offers a checklist as an exercise name", () => {
    const squat = { item: 1, exercise: "Back squat", sets: [{ reps: 5 }] };
    expect(exerciseNames([{ done: [list, squat] }])).toEqual(["Back squat"]);
  });
});
