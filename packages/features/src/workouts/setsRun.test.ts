import { describe, expect, it } from "vitest";
import {
  afterKey,
  exercisePosition,
  holdShort,
  itemDone,
  restAfterTick,
  setKey,
  withDoneSets,
} from "./setsRun";

const items = [
  { exercise: "Back squat", dose: { sets: 2, reps: 5, setRestS: 120 } },
  { exercise: "Bench press", dose: { sets: 1, reps: 8 } },
];

const ticked = (...keys: string[]): ReadonlySet<string> => new Set(keys);

describe("rest after a tick", () => {
  it("rests between sets under the set while the exercise has sets to go", () => {
    expect(restAfterTick(items, ticked("0:0"), { item: 0, set: 0 }, 180)).toEqual({
      at: setKey({ item: 0, set: 0 }),
      seconds: 120,
      next: null,
    });
  });

  it("rests between exercises once one is done, before the next still to do", () => {
    const all = ticked("0:0", "0:1");
    expect(itemDone(items, all, 0)).toBe(true);
    expect(restAfterTick(items, all, { item: 0, set: 1 }, 180)).toEqual({
      at: afterKey(0),
      seconds: 180,
      next: 1,
    });
  });

  it("rests the finished exercise's own rest before the next, where it sets one", () => {
    const own = [{ ...items[0]!, restAfterS: 90 }, items[1]!];
    expect(restAfterTick(own, ticked("0:0", "0:1"), { item: 0, set: 1 }, 180)).toEqual({
      at: afterKey(0),
      seconds: 90,
      next: 1,
    });
  });

  it("rests no more after the last exercise", () => {
    const all = ticked("0:0", "0:1", "1:0");
    expect(restAfterTick(items, all, { item: 1, set: 0 }, 180)).toBeNull();
  });
});

describe("hold short", () => {
  it("reads short only for a ticked set held under its target", () => {
    expect(holdShort({ onS: 30 }, { onS: 20 }, true)).toBe(true);
    expect(holdShort({ onS: 30 }, { onS: 20 }, false)).toBe(false);
    expect(holdShort({ onS: 30 }, { onS: 30 }, true)).toBe(false);
    expect(holdShort({ reps: 5 }, {}, true)).toBe(false);
  });
});

describe("set ranges", () => {
  const bench = { exercise: "Bench press", dose: { sets: 3, setsMax: 5, reps: 8 } };
  const four = {
    item: 0,
    exercise: "Bench press",
    sets: Array.from({ length: 4 }, () => ({ reps: 8 })),
  };

  it("counts the sets an item has added past its minimum", () => {
    const [live] = withDoneSets([bench], [four]);
    expect(live?.dose.sets).toBe(4);
    expect(itemDone([live!], new Set(["0:0", "0:1", "0:2"]), 0)).toBe(false);
  });

  it("counts fewer sets once some are removed", () => {
    const [live] = withDoneSets([bench], [{ ...four, sets: [{ reps: 8 }] }]);
    expect(live?.dose.sets).toBe(1);
  });

  it("leaves an item with no sets added past its minimum as it is", () => {
    expect(withDoneSets([bench], [])).toEqual([bench]);
  });
});

describe("the exercise counter beside a checklist", () => {
  const list = (k: number): boolean => k === 0;
  it("counts exercises only, and says nothing for a checklist alone", () => {
    expect(exercisePosition([0, 1, 2], 1, list)).toEqual({ at: 1, of: 2 });
    expect(exercisePosition([0, 1, 2], 2, list)).toEqual({ at: 2, of: 2 });
    expect(exercisePosition([0, 1, 2], 0, list)).toEqual({ at: 1, of: 2 });
    expect(exercisePosition([1, 2, 0], 0, list)).toEqual({ at: 2, of: 2 });
    expect(exercisePosition([0], 0, list)).toBeNull();
    expect(exercisePosition([], -1, list)).toBeNull();
  });

  it("reads past an exercise already behind it from a checklist, still counting it", () => {
    const list = (k: number): boolean => k === 0;
    const behind = (k: number): boolean => k === 1 || k === 2;
    expect(exercisePosition([0, 1, 2, 3], 0, list, behind)).toEqual({ at: 3, of: 3 });
  });
});
