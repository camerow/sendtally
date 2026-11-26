import { describe, expect, it } from "vitest";
import type { Dose, WeekChange } from "@sendtally/core/hang";
import { hangLoadText, weightText } from "../hang/weights";
import { t } from "../i18n";
import type { LibraryWorkout } from "../workouts/types";
import { shortcutChanges } from "./planMaths";
import {
  blockItem,
  changed,
  changedWeeks,
  filled,
  loadBars,
  loadText,
  resized,
  savedChanges,
  savedShortcuts,
  shapeable,
  sized,
  weekChangesOf,
  weekChangesToSave,
  withCell,
} from "./useBlockStep";

const WEIGHTED: Dose = { sets: 3, reps: 5, weightKg: 20 };
const REPS: Dose = { sets: 3, reps: 8 };
const OFF = { stepUp: false, deload: false };

describe("sized", () => {
  it("pads with empty weeks and cuts past the length", () => {
    expect(sized([{ reps: 6 }], 3)).toEqual([{ reps: 6 }, {}, {}]);
    expect(sized([{ reps: 6 }, { reps: 7 }, { reps: 8 }], 2)).toEqual([{ reps: 6 }, { reps: 7 }]);
    expect(sized(undefined, 2)).toEqual([{}, {}]);
  });
});

describe("changed", () => {
  it("is false for a week as written", () => {
    expect(changed(undefined)).toBe(false);
    expect(changed({})).toBe(false);
    expect(changed({ reps: 6 })).toBe(true);
  });
});

describe("blockItem", () => {
  const workout = (items: object[]): LibraryWorkout => ({ items }) as unknown as LibraryWorkout;

  it("picks the first weighted item, else the first that is not a checklist", () => {
    const list = { exercise: "warm", checklist: [], doses: [REPS] };
    const reps = { exercise: "pull", doses: [REPS] };
    const weighted = { exercise: "hang", doses: [WEIGHTED] };
    expect(blockItem(workout([list, reps, weighted]))).toBe(weighted);
    expect(blockItem(workout([list, reps]))).toBe(reps);
    expect(blockItem(workout([list]))).toBeUndefined();
    expect(blockItem(undefined)).toBeUndefined();
  });
});

describe("filled and resized", () => {
  const both = { stepUp: true, deload: true };

  it("fills every dose from the shortcuts", () => {
    expect(filled([WEIGHTED, REPS], both, 4, "kg")).toEqual({
      0: shortcutChanges(WEIGHTED, 4, both, "kg"),
      1: shortcutChanges(REPS, 4, both, "kg"),
    });
  });

  it("refills from the shortcuts when one is on", () => {
    expect(resized({ 0: [{ reps: 9 }] }, [WEIGHTED], both, 3, "kg")).toEqual(
      filled([WEIGHTED], both, 3, "kg")
    );
  });

  it("keeps typed changes and resizes each dose when none is on", () => {
    expect(resized({ 0: [{ reps: 9 }, {}, { reps: 7 }] }, [WEIGHTED, REPS], OFF, 2, "kg")).toEqual({
      0: [{ reps: 9 }, {}],
      1: [{}, {}],
    });
  });
});

describe("withCell", () => {
  it("sets one week of one dose and leaves the others", () => {
    expect(withCell({ 1: [{ reps: 4 }] }, 0, 3, 2, { reps: 6 })).toEqual({
      0: [{}, { reps: 6 }, {}],
      1: [{ reps: 4 }],
    });
  });
});

describe("loadText and loadBars", () => {
  it("names the load by kind, else the reps", () => {
    expect(loadText(WEIGHTED, "hangboard", "kg")).toBe(hangLoadText(20, "kg"));
    expect(loadText(WEIGHTED, "strength", "kg")).toBe(weightText(20, "kg"));
    expect(loadText(REPS, "hangboard", "kg")).toBe(t("statistics.repsValue", { count: 8 }));
  });

  it("sizes each week by volume and marks the last as the deload", () => {
    const bars = loadBars(WEIGHTED, [{}, { weightKg: 25 }], true, "strength", "kg");
    expect(bars.map((b) => b.value)).toEqual([300, 375]);
    expect(bars.map((b) => b.deload)).toEqual([false, true]);
    expect(loadBars(REPS, [{}], true, "strength", "kg")).toEqual([
      { label: t("statistics.repsValue", { count: 8 }), value: 240, deload: false },
    ]);
  });
});

describe("changedWeeks and weekChangesOf", () => {
  const doses = [
    [{}, { reps: 6 }, {}],
    [{}, { reps: 9 }, { sets: 2 }],
  ];

  it("counts a week once whichever doses change it", () => {
    expect(changedWeeks(doses, 3)).toBe(2);
  });

  it("writes each changed cell for every member", () => {
    expect(weekChangesOf(["m1", "m2"], doses, "i0")).toEqual(
      ["m1", "m2"].flatMap((membershipId) => [
        { membershipId, week: 2, dose: 0, itemId: "i0", change: { reps: 6 } },
        { membershipId, week: 2, dose: 1, itemId: "i0", change: { reps: 9 } },
        { membershipId, week: 3, dose: 1, itemId: "i0", change: { sets: 2 } },
      ])
    );
  });
});

describe("shapeable", () => {
  const workout = (id: string, items: object[]): LibraryWorkout =>
    ({ id, items }) as unknown as LibraryWorkout;

  it("is the first workout with an exercise to load, none when only Climbing is placed", () => {
    const climbing = workout("climb", []);
    const hangs = workout("hangs", [{ exercise: "half", doses: [REPS] }]);
    expect(shapeable([climbing, undefined, hangs])).toBe(hangs);
    expect(shapeable([climbing])).toBeUndefined();
  });
});

describe("Shape the weeks, opened again", () => {
  const first: WeekChange[] = [
    { membershipId: "m1", week: 2, dose: 0, itemId: "i0", change: { reps: 6 } },
    { membershipId: "m1", week: 3, dose: 1, itemId: "i0", change: { sets: 2 } },
  ];
  const saved: WeekChange[] = [
    ...first,
    { membershipId: "m2", week: 2, dose: 0, itemId: "i0", change: { reps: 9 } },
    { membershipId: "m1", week: 2, dose: 0, itemId: "i1", change: { reps: 9 } },
  ];

  it("shows the first visit's changes to this item of this workout", () => {
    expect(savedChanges(saved, "m1", "i0", 2, 3)).toEqual({
      0: [{}, { reps: 6 }, {}],
      1: [{}, {}, { sets: 2 }],
    });
  });

  it("sends an empty change for a week shaped before and cleared now", () => {
    const doses = [
      [{}, { reps: 6 }, {}],
      [{}, {}, {}],
    ];
    expect(weekChangesToSave(saved, ["m1"], doses, "i0")).toEqual([
      first[0],
      { ...first[1], change: {} },
    ]);
  });

  it("saves what it loaded when left untouched", () => {
    const doses = Object.values(savedChanges(saved, "m1", "i0", 2, 3));
    expect(weekChangesToSave(saved, ["m1"], doses, "i0")).toEqual(first);
  });

  it("turns on the shortcuts that filled the saved cells, and none for typed ones", () => {
    const both = { stepUp: true, deload: true };
    expect(savedShortcuts(filled([WEIGHTED], both, 4, "kg"), [WEIGHTED], 4, "kg")).toEqual(both);
    expect(savedShortcuts({ 0: [{}, { reps: 6 }] }, [WEIGHTED], 2, "kg")).toEqual(OFF);
    expect(savedShortcuts({}, [{ sets: 1 }], 3, "kg")).toEqual(OFF);
  });
});
