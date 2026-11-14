import { BUILT_IN_EXERCISES, BUILT_IN_WORKOUTS } from "@sendtally/core/hang";
import { describe, expect, it } from "vitest";
import { en } from "./locales/en";

describe("built-in names", () => {
  it("match core's English names, which the Worker reads", () => {
    const catalog: Readonly<Record<string, string>> = en;
    const mismatched = [
      ...BUILT_IN_EXERCISES.map((e) => ({ key: `workouts.exercise.${e.id}`, name: e.name })),
      ...BUILT_IN_WORKOUTS.map((w) => ({ key: `workouts.builtIn.${w.id}.name`, name: w.name })),
    ].filter(({ key, name }) => catalog[key] !== name);
    expect(mismatched).toEqual([]);
  });
});
