import { describe, expect, it } from "vitest";
import type { Dose } from "@sendtally/core/hang";
import { stepped, weekChips, weekFields, withField } from "./weeks";

const squat: Dose = { sets: 5, reps: 5, weightKg: 100 };
const repeaters: Dose = { sets: 3, reps: 6, onS: 7, offS: 3, edgeMm: 20 };

describe("weekChips", () => {
  it("writes each difference from the workout as written, gold for more and green for less", () => {
    expect(weekChips("strength", squat, { sets: 3, weightKg: 95 }, "kg")).toEqual([
      { text: "−2 sets", more: false },
      { text: "−5 kg", more: false },
    ]);
    expect(weekChips("strength", squat, { weightKg: 102.5 }, "kg")).toEqual([
      { text: "+2.5 kg", more: true },
    ]);
  });

  it("names hangboard fields as a hangboard reads them", () => {
    expect(
      weekChips("hangboard", repeaters, { sets: 2, reps: 7, onS: 9, edgeMm: 18 }, "kg").map(
        (c) => c.text
      )
    ).toEqual(["−1 set", "+1 hang", "9s hang", "18\u00A0mm edge"]);
  });

  it("counts timed sets as rounds and leaves out what matches", () => {
    const tempo: Dose = { sets: 5, onS: 180, offS: 120 };
    expect(weekChips("other", tempo, { sets: 6, offS: 120 }, "kg")).toEqual([
      { text: "+1 round", more: true },
    ]);
  });
});

describe("week fields", () => {
  it("offers what the kind has", () => {
    expect(weekFields("hangboard", repeaters)).toEqual([
      "sets",
      "reps",
      "onS",
      "offS",
      "edgeMm",
      "weightKg",
      "setRestS",
    ]);
    expect(weekFields("hangboard", { sets: 5, reps: 5 })).toEqual([
      "sets",
      "reps",
      "weightKg",
      "setRestS",
    ]);
    expect(weekFields("hangboard", { sets: 5, onS: 10, edgeMm: 0 })).toEqual([
      "sets",
      "onS",
      "weightKg",
      "setRestS",
    ]);
    expect(weekFields("strength", squat)).toEqual(["sets", "reps", "weightKg", "setRestS"]);
    expect(weekFields("other", { sets: 4, onS: 240 })).toEqual(["sets", "onS", "offS", "weightKg"]);
  });

  it("steps weight in the user's unit and never below a set", () => {
    expect(stepped(squat, "weightKg", 1, "kg").weightKg).toBe(102.5);
    expect(stepped({ sets: 1 }, "sets", -1, "kg")).toEqual({ sets: 1 });
    expect(stepped(repeaters, "weightKg", 1, "lb").weightKg).toBe(2.27);
  });

  it("takes a typed value, refusing what is not one", () => {
    expect(withField(squat, "reps", 3, "kg")).toEqual({ ...squat, reps: 3 });
    expect(withField(squat, "sets", 0, "kg")).toBeNull();
    expect(withField(squat, "reps", Number.NaN, "kg")).toBeNull();
  });
});
