import { describe, expect, it } from "@jest/globals";
import { afterKey, itemDone, restAfterTick, setKey } from "./setsRun";

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

  it("rests no more after the last exercise", () => {
    const all = ticked("0:0", "0:1", "1:0");
    expect(restAfterTick(items, all, { item: 1, set: 0 }, 180)).toBeNull();
  });
});
