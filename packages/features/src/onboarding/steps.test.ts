import { describe, expect, it } from "vitest";
import { historySteps, remainingSteps, resumeStep, stepPosition } from "./steps";
import type { OnboardingProgress } from "./types";

const NONE: OnboardingProgress = {
  sessions: false,
  exercises: false,
  workouts: false,
  blockMemberships: false,
  scheduledBlocks: false,
};

describe("historySteps", () => {
  it("goes through the import or by hand, and is only H1 before the answer", () => {
    expect(historySteps("import")).toEqual(["H1", "H2i", "H3i", "H4", "H6"]);
    expect(historySteps("by_hand")).toEqual(["H1", "H2h", "H4", "H6"]);
    expect(historySteps(null)).toEqual(["H1"]);
  });

  it("leaves the spreadsheet match out for now", () => {
    expect(historySteps("import")).not.toContain("H2s");
  });
});

describe("remainingSteps", () => {
  it("is the whole path for a new user", () => {
    expect(remainingSteps("plan", null, NONE)).toEqual(["P1w", "P5", "P7"]);
    expect(remainingSteps("history", "import", NONE)).toEqual(historySteps("import"));
  });

  it.each([
    [{ workouts: true }, ["P1w", "P5", "P7"]],
    [{ blockMemberships: true }, ["P1w", "P5", "P7"]],
    [{ scheduledBlocks: true }, ["P5", "P7"]],
    [{ exercises: true, sessions: true }, ["P1w", "P5", "P7"]],
  ])("drops Build your week once a block is scheduled: %o", (done, steps) => {
    expect(remainingSteps("plan", null, { ...NONE, ...done })).toEqual(steps);
  });

  it("reopens a finished history path on adding climbs, whatever the way", () => {
    const progress = { ...NONE, sessions: true };
    for (const way of ["import", "by_hand", null] as const)
      expect(remainingSteps("history", way, progress)).toEqual(["H2h", "H4", "H6"]);
  });
});

describe("resumeStep", () => {
  it("is the first step not done", () => {
    expect(resumeStep("history", null, NONE)).toBe("H1");
    expect(resumeStep("history", null, { ...NONE, sessions: true })).toBe("H2h");
    expect(resumeStep("plan", null, { ...NONE, blockMemberships: true })).toBe("P1w");
    expect(resumeStep("plan", null, { ...NONE, scheduledBlocks: true })).toBe("P5");
  });
});

describe("stepPosition", () => {
  it("counts two plan stages and three history ones", () => {
    expect(stepPosition("plan", "P1w")).toEqual({ n: 1, total: 2 });
    expect(stepPosition("plan", "P5")).toEqual({ n: 2, total: 2 });
    expect(stepPosition("history", "H2h")).toEqual({ n: 2, total: 3 });
    expect(stepPosition("history", "H4")).toEqual({ n: 3, total: 3 });
  });

  it("shows no progress on the chooser or a side step", () => {
    expect(stepPosition(null, "choose")).toEqual({ n: 0, total: 0 });
    expect(stepPosition("plan", "P2")).toEqual({ n: 0, total: 0 });
    expect(stepPosition("plan", "P4")).toEqual({ n: 0, total: 0 });
  });
});
