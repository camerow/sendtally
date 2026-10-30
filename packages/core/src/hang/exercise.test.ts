import { describe, expect, it } from "vitest";
import { defaultMeasure, measureOf, measuresFor } from "./exercise";

describe("measureOf", () => {
  it.each([
    ["strength", [{ reps: 5, weightKg: 100 }], "repsWeight"],
    ["strength", [{ onS: 10, weightKg: -20 }], "secondsWeight"],
    ["mobility", [{ onS: 60 }], "seconds"],
    ["other", [{ onS: 180 }], "rounds"],
    ["mobility", [{ reps: 10 }], "reps"],
    ["mobility", [], "seconds"],
    ["climbing", [], "reps"],
    ["climbing", [{ onS: 1200 }], "seconds"],
  ] as const)("reads %s sets %j as %s", (kind, sets, measure) => {
    expect(measureOf(kind, sets)).toBe(measure);
  });

  it("starts each category on its own measure", () => {
    expect(defaultMeasure("strength")).toBe("repsWeight");
    expect(defaultMeasure("mobility")).toBe("seconds");
    expect(defaultMeasure("climbing")).toBe("reps");
  });

  it("offers climbing only climbs and time on the wall", () => {
    expect(measuresFor("climbing")).toEqual(["reps", "seconds"]);
    expect(measuresFor("strength")).toHaveLength(5);
    expect(measuresFor("hangboard")).toEqual(["hang", "repsWeight", "secondsWeight"]);
  });
});
