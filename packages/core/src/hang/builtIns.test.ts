import { describe, expect, it } from "vitest";
import { BUILT_IN_EXERCISES, BUILT_IN_WORKOUTS } from "./builtIns";

const duplicates = (ids: readonly string[]): string[] =>
  ids.filter((id, i) => ids.indexOf(id) !== i);

describe("built-in catalogue", () => {
  it("never repeats an id", () => {
    expect(duplicates(BUILT_IN_EXERCISES.map((e) => e.id))).toEqual([]);
    expect(duplicates(BUILT_IN_WORKOUTS.map((w) => w.id))).toEqual([]);
  });
});
