import { describe, expect, it } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import { exerciseLabel } from "./builtIns";
import { entryNamed, pickerEntries, type PickerWorld } from "./picker";

const mine = (id: string, name: string, more: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  builtIn: null,
  archived: false,
  ...more,
});

const world: PickerWorld = {
  mine: [
    mine("e1", "Weighted pull-up"),
    mine("e2", "Back squat", { builtIn: "backSquat" }),
    mine("e3", "Jefferson curl", { kind: "mobility", measure: "seconds" }),
    mine("e4", "Old lift", { archived: true }),
  ],
  grips: [{ id: "half", name: "Half crimp", custom: false, hidden: false }],
  uses: new Map([
    ["back squat", 12],
    ["weighted pull-up", 7],
    ["half", 3],
  ]),
  inWorkout: ["Back squat"],
  fingers: false,
};

const names = (filter: Parameters<typeof pickerEntries>[1], w = world): string[] =>
  pickerEntries(w, filter).map((e) => e.name);

describe("pickerEntries", () => {
  it("lists a category most used first, then the user's own, then the library, without archived ones", () => {
    const strength = pickerEntries(world, { category: "strength", text: "" });
    expect(strength.slice(0, 2).map((e) => [e.name, e.uses, e.inWorkout])).toEqual([
      ["Back squat", 12, true],
      ["Weighted pull-up", 7, false],
    ]);
    expect(strength[2]?.library).toBe(true);
    expect(strength.map((e) => e.name)).not.toContain("Old lift");
    expect(strength.filter((e) => e.name === "Back squat")).toHaveLength(1);
  });

  it("searches every category with All, ignoring case and accents", () => {
    expect(names({ category: "all", text: "CURL" })).toEqual([
      "Jefferson curl",
      "Reverse wrist curls",
    ]);
    expect(names({ category: "all", text: "nothing like this" })).toEqual([]);
  });

  it("offers grips only to a Fingers workout, and nothing else", () => {
    const fingers = { ...world, fingers: true, inWorkout: ["half"] };
    expect(pickerEntries(fingers, { category: "all", text: "" })).toMatchObject([
      { name: "Half crimp", uses: 3, inWorkout: true },
    ]);
    expect(names({ category: "all", text: "crimp" })).toEqual([]);
  });
});

describe("entryNamed", () => {
  it("finds the exercise a typed name already belongs to, built-ins included", () => {
    expect(entryNamed(world, " weighted PULL-UP")?.key).toBe("mine:e1");
    expect(entryNamed(world, "bench press")?.key).toBe("builtIn:benchPress");
    expect(entryNamed(world, "Nordic curl")).toBeUndefined();
  });
});

describe("exerciseLabel", () => {
  it("names an exercise picked from the built-ins in the user's language", () => {
    expect(exerciseLabel({ name: "Kniebeuge", builtIn: "backSquat" })).toBe("Back squat");
    expect(exerciseLabel({ name: "Nordic curl", builtIn: null })).toBe("Nordic curl");
  });
});
