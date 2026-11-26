import { describe, expect, it } from "vitest";
import { tallyMeasuresOf } from "./measure";

const library = [
  { name: "Circuit", kind: "climbing", measure: "seconds" },
  { name: "Squat", kind: "strength", measure: "repsWeight" },
] as const;

const noGrip = (): boolean => false;

describe("tallyMeasuresOf", () => {
  it("reads a known exercise by its measure, in any case", () => {
    expect(tallyMeasuresOf(library, "climbing", noGrip)("circuit")).toBe("wallTime");
    expect(tallyMeasuresOf(library, "strength", noGrip)("Squat")).toBeNull();
  });

  it("logs climbs for an exercise the library does not know, only in a climbing workout", () => {
    expect(tallyMeasuresOf(library, "climbing", noGrip)("Hard Boulders")).toBe("climbs");
    expect(tallyMeasuresOf(library, "strength", noGrip)("Hard Boulders")).toBeNull();
  });

  it("reads a built-in the user never saved by its own measure, so ARC keeps its clock", () => {
    expect(tallyMeasuresOf([], "climbing", noGrip)("ARC")).toBe("wallTime");
    expect(tallyMeasuresOf([], "climbing", noGrip)("arc")).toBe("wallTime");
    expect(tallyMeasuresOf([], "climbing", noGrip)("Circuit laps")).toBe("laps");
  });

  it("never logs a grip on the tally, though the library does not know it", () => {
    const isGrip = (name: string): boolean => name === "half";
    expect(tallyMeasuresOf(library, "climbing", isGrip)("half")).toBeNull();
    expect(tallyMeasuresOf(library, "climbing", isGrip)("Hard Boulders")).toBe("climbs");
  });
});
