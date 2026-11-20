import { describe, expect, it } from "vitest";
import {
  DOSE_FIELDS_OF,
  doseFieldsFor,
  doseMeasureOf,
  fieldLimits,
  fieldPlaceholder,
  fieldValue,
  newDoseFor,
  withField,
  withFieldRange,
} from "./doseFields";

const [hangs, hang, rest, sets] = DOSE_FIELDS_OF.hangboard;
const [, , weight] = DOSE_FIELDS_OF.strength;

describe("dose fields", () => {
  it("reads times in seconds and weights in the user's unit, null when unset", () => {
    expect(fieldValue(rest!, { sets: 1, offS: 180 }, "kg")).toBe(180);
    expect(fieldValue(weight!, { sets: 1, weightKg: 100 }, "lb")).toBe(220.46);
    expect(fieldValue(hangs!, { sets: 1 }, "kg")).toBeNull();
    expect(withField({ sets: 1 }, weight!, -20, "kg")).toEqual({ sets: 1, weightKg: -20 });
  });

  it("clears any field but sets at zero, and keeps sets at one or more", () => {
    expect(withField({ sets: 1 }, rest!, 90, "kg")).toEqual({ sets: 1, offS: 90 });
    expect(withField({ sets: 1, onS: 7 }, hang!, 0, "kg")).toEqual({ sets: 1 });
    expect(withField({ sets: 3 }, sets!, 0, "kg")).toEqual({ sets: 1 });
    expect(withField({ sets: 3, reps: 6 }, hangs!, 6.4, "kg")).toEqual({ sets: 3, reps: 6 });
  });

  it("steps weight by 2.5 kg or 5 lb with a sign, and counts by one", () => {
    expect(fieldLimits(weight!, "kg")).toEqual({ step: 2.5, decimals: true, min: -200 });
    expect(fieldLimits(weight!, "lb").step).toBe(5);
    expect(fieldLimits(sets!, "kg")).toEqual({ step: 1, min: 1, max: 100 });
  });

  it("asks a climbing exercise for climbs or time, never a grade, and empty climbs runs until Done", () => {
    const climbing = doseMeasureOf({ kind: "climbing", measure: "reps" });
    expect(climbing).toBe("climbs");
    expect(doseMeasureOf({ kind: "climbing", measure: "rounds" })).toBe("rounds");
    expect(doseMeasureOf({ kind: "strength", measure: "reps" })).toBe("reps");
    const [, climbs] = doseFieldsFor("climbing", climbing);
    expect(doseFieldsFor("climbing", "climbs").map((f) => f.label)).toEqual([
      "workouts.dose.sets",
      "workouts.dose.climbs",
      "workouts.dose.rpe",
    ]);
    expect(doseFieldsFor("climbing", "wallTime").map((f) => f.key)).toEqual([
      "sets",
      "onS",
      "targetRpe",
    ]);
    expect(withField({ sets: 1, reps: 4 }, climbs!, 0, "kg")).toEqual({ sets: 1 });
    expect(newDoseFor("climbing", "wallTime")).toEqual({ sets: 2, onS: 1200, setRestS: 300 });
    expect(doseMeasureOf({ kind: "climbing", measure: "laps" })).toBe("laps");
    expect(doseFieldsFor("climbing", "laps", { sets: 3, reps: 40 }).map((f) => f.label)).toEqual([
      "workouts.dose.laps",
      "workouts.dose.moves",
      "workouts.dose.rpe",
    ]);
    expect(doseFieldsFor("climbing", "laps", { sets: 3, onS: 240 }).map((f) => f.key)).toEqual([
      "sets",
      "onS",
      "targetRpe",
    ]);
  });

  it("asks an exercise for its own target, 1 to 10, blank for none, but not timed rounds or a grip", () => {
    const rpe = doseFieldsFor("strength", "repsWeight").find((f) => f.key === "targetRpe");
    expect(rpe).toBeDefined();
    expect(withField({ sets: 3 }, rpe!, 8, "kg")).toEqual({ sets: 3, targetRpe: 8 });
    expect(withField({ sets: 3 }, rpe!, 14, "kg")).toEqual({ sets: 3, targetRpe: 10 });
    expect(withField({ sets: 3, targetRpe: 8 }, rpe!, 0, "kg")).toEqual({ sets: 3 });
    expect(fieldLimits(rpe!, "kg")).toEqual({ step: 1, min: 0, max: 10 });
    expect(doseFieldsFor("other").some((f) => f.key === "targetRpe")).toBe(false);
    expect(doseFieldsFor("hangboard").some((f) => f.key === "targetRpe")).toBe(false);
  });

  it("asks a grip for hangs, or a ground pull for reps or time with no edge", () => {
    const keys = (measure?: "hang" | "repsWeight" | "secondsWeight") =>
      doseFieldsFor("hangboard", measure).map((f) => f.key);
    expect(keys()).toEqual(["reps", "onS", "offS", "sets"]);
    expect(keys("hang")).toEqual(["reps", "onS", "offS", "sets"]);
    expect(keys("repsWeight")).toEqual(["reps", "sets"]);
    expect(keys("secondsWeight")).toEqual(["onS", "sets"]);
    expect(newDoseFor("hangboard", "repsWeight")).toEqual({ sets: 5, reps: 5, setRestS: 120 });
    expect(newDoseFor("hangboard", "secondsWeight")).toEqual({
      sets: 5,
      reps: 1,
      onS: 10,
      edgeMm: 0,
      setRestS: 120,
    });
  });
});

describe("dose ranges", () => {
  const [sets, reps, weight] = DOSE_FIELDS_OF.strength;

  it("takes a range in strength sets and reps, and a top at or under the bottom as one number", () => {
    expect(withFieldRange({ sets: 3, reps: 8 }, sets!, 3, 5, "kg")).toEqual({
      sets: 3,
      setsMax: 5,
      reps: 8,
    });
    expect(withFieldRange({ sets: 3, reps: 8 }, reps!, 8, 12, "kg")).toEqual({
      sets: 3,
      reps: 8,
      repsMax: 12,
    });
    expect(withFieldRange({ sets: 3, setsMax: 5 }, sets!, 4, undefined, "kg")).toEqual({ sets: 4 });
    expect(withFieldRange({ sets: 3, setsMax: 5 }, sets!, 5, 5, "kg")).toEqual({ sets: 5 });
    expect(withFieldRange({ sets: 3, reps: 8, repsMax: 12 }, reps!, 0, 12, "kg")).toEqual({
      sets: 3,
    });
    expect(weight?.range).toBeUndefined();
    expect(DOSE_FIELDS_OF.hangboard.some((f) => f.range !== undefined)).toBe(false);
    expect(DOSE_FIELDS_OF.other.some((f) => f.range !== undefined)).toBe(false);
  });
});

describe("dose placeholders", () => {
  it("shows an example range in an empty sets or reps field that takes one, and today's hint elsewhere", () => {
    const [sets, reps, weight, rpe] = DOSE_FIELDS_OF.strength;
    expect(fieldPlaceholder(sets!)).toBe("3, 3-5");
    expect(fieldPlaceholder(reps!)).toBe("8, 8-12");
    expect(fieldPlaceholder(weight!)).toBe("BW");
    expect(fieldPlaceholder(rpe!)).toBeUndefined();
    expect(DOSE_FIELDS_OF.hangboard.map(fieldPlaceholder)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});
