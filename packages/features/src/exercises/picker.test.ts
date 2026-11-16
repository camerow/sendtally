import { describe, expect, it } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import { exerciseLabel } from "./builtIns";
import {
  entryNamed,
  exerciseKindIn,
  pickerEntries,
  pickerOffer,
  pickerState,
  type PickerWorld,
} from "./picker";

const mine = (id: string, name: string, more: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  description: "",
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
  offer: "exercises",
};

const names = (filter: Parameters<typeof pickerEntries>[1], w = world): string[] =>
  pickerEntries(w, filter).map((e) => e.name);

describe("pickerEntries", () => {
  it("lists a category most used first, then by name, without archived ones", () => {
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
      "Biceps curl",
      "Hammer curl",
      "Jefferson curl",
      "Nordic hamstring curl",
      "Reverse wrist curls",
      "Wrist curls",
    ]);
    expect(names({ category: "all", text: "nothing like this" })).toEqual([]);
  });

  it("offers grips only to a Fingers workout, and nothing else", () => {
    const fingers = { ...world, offer: "grips" as const, inWorkout: ["half"] };
    expect(pickerEntries(fingers, { category: "all", text: "" })).toMatchObject([
      { name: "Half crimp", uses: 3, inWorkout: true },
    ]);
    expect(names({ category: "all", text: "crimp" })).toEqual([]);
  });

  it("offers grips beside everything else to a workout with nothing in it", () => {
    const empty = { ...world, offer: "all" as const, inWorkout: [] };
    expect(names({ category: "all", text: "crimp" }, empty)).toEqual(["Half crimp"]);
    expect(names({ category: "hangboard", text: "" }, empty)).toEqual(["Half crimp"]);
    expect(names({ category: "all", text: "pull-up" }, empty)).toContain("Weighted pull-up");
  });

  it("orders grips and exercises as one list under All, most used first, then by name", () => {
    const fresh = {
      ...world,
      offer: "all" as const,
      inWorkout: [],
      uses: new Map([["deadlift", 2]]),
    };
    const all = names({ category: "all", text: "" }, fresh);
    expect(all[0]).toBe("Deadlift");
    const rest = all.slice(1);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
    expect(rest.indexOf("Half crimp")).toBeGreaterThan(rest.indexOf("Back squat"));
  });
});

describe("pickerOffer", () => {
  it("follows what the workout holds, so taking out the last grip offers everything again", () => {
    expect(pickerOffer(world, [])).toBe("all");
    expect(pickerOffer(world, ["half", "open"])).toBe("grips");
    expect(pickerOffer(world, ["Back squat"])).toBe("exercises");
    expect(pickerOffer(world, ["half"].slice(1))).toBe("all");
  });
});

describe("exerciseKindIn", () => {
  it("knows grips, the user's own and the built-ins, and nothing else", () => {
    const kindIn = exerciseKindIn(world);
    expect(kindIn("half")).toBe("hangboard");
    expect(kindIn("jefferson CURL")).toBe("mobility");
    expect(kindIn("Bench press")).toBe("strength");
    expect(kindIn("Made just now")).toBeUndefined();
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

  it("keeps the name the user renamed a built-in to", () => {
    expect(exerciseLabel({ name: "High bar squat", builtIn: "backSquat" })).toBe("High bar squat");
  });
});

describe("pickerState", () => {
  it("offers every category and asks what New makes until something is in, then keeps to one side", () => {
    expect(pickerState(world, [], [], "all")).toMatchObject({ offer: "all", newKind: "choose" });
    expect(pickerState(world, [], [], "all").kinds).toContain("hangboard");
    const grips = pickerState(world, ["half"], [], "all");
    expect(grips).toMatchObject({ offer: "grips", newKind: "hangboard" });
    const lifts = pickerState(world, ["Back squat"], [], "all");
    expect(lifts.kinds).not.toContain("hangboard");
    expect(pickerState(world, ["Back squat"], [], "mobility").newKind).toBe("mobility");
  });
});
