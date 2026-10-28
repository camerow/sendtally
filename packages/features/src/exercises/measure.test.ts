import { describe, expect, it } from "vitest";
import { tallyMeasuresOf } from "./measure";

const library = [
  { name: "Circuit", kind: "climbing", measure: "seconds" },
  { name: "Squat", kind: "strength", measure: "repsWeight" },
] as const;

describe("tallyMeasuresOf", () => {
  it("reads a known exercise by its measure, in any case", () => {
    expect(tallyMeasuresOf(library, "climbing")("circuit")).toBe("wallTime");
    expect(tallyMeasuresOf(library, "strength")("Squat")).toBeNull();
  });

  it("logs climbs for an exercise the library does not know, only in a climbing workout", () => {
    expect(tallyMeasuresOf(library, "climbing")("Hard Boulders")).toBe("climbs");
    expect(tallyMeasuresOf(library, "strength")("Hard Boulders")).toBeNull();
  });
});
