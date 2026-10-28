import { describe, expect, it } from "vitest";
import { measureChangeNeedsWarning } from "./measure";
import { eachSideOf } from "./sides";

describe("eachSideOf", () => {
  it("knows a one-sided exercise by name in any case", () => {
    const sided = eachSideOf([
      { name: "Pigeon", eachSide: true },
      { name: "Squat", eachSide: false },
    ]);
    expect(sided(" pigeon ")).toBe(true);
    expect(sided("Squat")).toBe(false);
    expect(sided("Plank")).toBe(false);
  });
});

describe("measureChangeNeedsWarning", () => {
  it("warns only when a logged exercise changes measure", () => {
    expect(measureChangeNeedsWarning("reps", "seconds", true)).toBe(true);
    expect(measureChangeNeedsWarning("reps", "seconds", false)).toBe(false);
    expect(measureChangeNeedsWarning("reps", "reps", true)).toBe(false);
  });
});
