import { describe, expect, it } from "vitest";
import { blockEnd, blockWeekOn, defaultPhases, nextPhase, phaseOn, resizePhases } from "./block";
import type { TrainingBlock } from "./types";

const block: TrainingBlock = {
  id: "b",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 4,
  phases: ["build", "build", "test", "deload"],
  notes: null,
  endedOn: null,
};

describe("training blocks", () => {
  it("ends after its last week, or when it was ended early", () => {
    expect(blockEnd(block)).toBe("2026-10-26");
    expect(blockEnd({ ...block, endedOn: "2026-10-10" })).toBe("2026-10-10");
    expect(blockEnd({ ...block, endedOn: "2026-12-01" })).toBe("2026-10-26");
  });

  it("numbers weeks from its start and knows nothing outside it", () => {
    expect(blockWeekOn(block, "2026-09-27")).toBeNull();
    expect(blockWeekOn(block, "2026-09-28")).toBe(1);
    expect(blockWeekOn(block, "2026-10-04")).toBe(1);
    expect(blockWeekOn(block, "2026-10-05")).toBe(2);
    expect(blockWeekOn(block, "2026-10-25")).toBe(4);
    expect(blockWeekOn(block, "2026-10-26")).toBeNull();
  });

  it("gives the phase of the week a date falls in", () => {
    expect(phaseOn(block, "2026-10-12")).toBe("test");
    expect(phaseOn(block, "2026-10-20")).toBe("deload");
    expect(phaseOn({ ...block, endedOn: "2026-10-19" }, "2026-10-20")).toBeNull();
  });

  it("defaults to build weeks with a closing deload from four weeks", () => {
    expect(defaultPhases(3)).toEqual(["build", "build", "build"]);
    expect(defaultPhases(5)).toEqual(["build", "build", "build", "build", "deload"]);
  });

  it("keeps phases when resized and cycles one through the three", () => {
    expect(resizePhases(["test", "deload"], 3)).toEqual(["test", "deload", "build"]);
    expect(resizePhases(["test", "deload"], 1)).toEqual(["test"]);
    expect(nextPhase("build")).toBe("deload");
    expect(nextPhase("deload")).toBe("test");
    expect(nextPhase("test")).toBe("build");
  });
});
