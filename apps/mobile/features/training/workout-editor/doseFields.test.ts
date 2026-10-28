import { describe, expect, it } from "@jest/globals";
import {
  DOSE_FIELDS_OF,
  doseFieldsFor,
  doseMeasureOf,
  fieldText,
  newDoseFor,
  withField,
} from "./doseFields";

const [hangs, hang, rest, sets] = DOSE_FIELDS_OF.hangboard;
const [, , weight] = DOSE_FIELDS_OF.strength;

describe("dose fields", () => {
  it("reads times as seconds or m:ss, and weights in the user's unit", () => {
    expect(fieldText(hang!, { sets: 1, onS: 7 }, "kg")).toBe("7");
    expect(fieldText(rest!, { sets: 1, offS: 180 }, "kg")).toBe("3:00");
    expect(fieldText(weight!, { sets: 1, weightKg: 100 }, "lb")).toBe("220.5");
    expect(fieldText(hangs!, { sets: 1 }, "kg")).toBe("");
    expect(fieldText(weight!, { sets: 1, weightKg: -20 }, "kg")).toBe("−20");
    expect(withField({ sets: 1 }, weight!, "−20", "kg")).toEqual({ sets: 1, weightKg: -20 });
  });

  it("takes typed numbers, clears optional fields, and refuses what is not a number", () => {
    expect(withField({ sets: 1 }, rest!, "1:30", "kg")).toEqual({ sets: 1, offS: 90 });
    expect(withField({ sets: 1, onS: 7 }, hang!, " ", "kg")).toEqual({ sets: 1 });
    expect(withField({ sets: 3 }, sets!, "", "kg")).toBeNull();
    expect(withField({ sets: 3 }, sets!, "0", "kg")).toEqual({ sets: 1 });
    expect(withField({ sets: 3 }, hangs!, "six", "kg")).toBeNull();
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
    ]);
    expect(doseFieldsFor("climbing", "wallTime").map((f) => f.key)).toEqual(["sets", "onS"]);
    expect(withField({ sets: 1, reps: 4 }, climbs!, "", "kg")).toEqual({ sets: 1 });
    expect(newDoseFor("climbing", "wallTime")).toEqual({ sets: 2, onS: 1200, setRestS: 300 });
  });
});
