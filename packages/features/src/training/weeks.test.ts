import { describe, expect, it } from "vitest";
import type { Dose } from "@sendtally/core/hang";
import { cellText, loadColumns, stepped, weekFields, withWeekField } from "./weeks";

const squat: Dose = { sets: 5, reps: 5, weightKg: 100 };
const repeaters: Dose = { sets: 3, reps: 6, onS: 7, offS: 3, edgeMm: 20 };

describe("weekly load", () => {
  it("leads a hang with edge and load, leaving out rests and hangs per set unless a week changes them", () => {
    expect(loadColumns("hangboard", repeaters, [])).toEqual(["edgeMm", "weightKg", "sets", "onS"]);
    expect(loadColumns("hangboard", repeaters, [{ offS: 4 }])).toEqual([
      "edgeMm",
      "weightKg",
      "sets",
      "onS",
      "offS",
    ]);
  });

  it("shows what a lift sets", () => {
    expect(loadColumns("strength", squat, [])).toEqual(["sets", "reps", "weightKg"]);
  });

  it("reads a cell as the table shows it", () => {
    expect(cellText("hangboard", { ...repeaters, weightKg: 8 }, "weightKg", "kg")).toBe("+8");
    expect(cellText("hangboard", repeaters, "weightKg", "kg")).toBe("–");
    expect(cellText("hangboard", repeaters, "onS", "kg")).toBe("7s");
    expect(cellText("strength", squat, "weightKg", "kg")).toBe("100");
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
    expect(withWeekField(squat, "reps", 3, "kg")).toEqual({ ...squat, reps: 3 });
    expect(withWeekField(squat, "sets", 0, "kg")).toBeNull();
    expect(withWeekField(squat, "reps", Number.NaN, "kg")).toBeNull();
  });
});
