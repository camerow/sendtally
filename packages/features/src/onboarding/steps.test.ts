import { describe, expect, it } from "vitest";
import { historySteps, planSteps, remainingSteps, resumeStep, stepPosition } from "./steps";
import type { OnboardingProgress } from "./types";

const NONE: OnboardingProgress = {
  sessions: false,
  exercises: false,
  workouts: false,
  blockMemberships: false,
  scheduledBlocks: false,
};
const FRESH = { membershipShown: false };
const SHOWN = { membershipShown: true };

describe("historySteps", () => {
  it("goes through the import or by hand, and is only H1 before the answer", () => {
    expect(historySteps("import")).toEqual(["H1", "H2i", "H3i", "H4", "H5", "H6"]);
    expect(historySteps("by_hand")).toEqual(["H1", "H2h", "H4", "H5", "H6"]);
    expect(historySteps(null)).toEqual(["H1"]);
  });

  it("leaves the spreadsheet match out for now", () => {
    expect(historySteps("import")).not.toContain("H2s");
  });
});

describe("planSteps", () => {
  it("is P1 to P7", () => {
    expect(planSteps()).toEqual(["P1", "P2", "P3", "P4", "P5", "P6", "P7"]);
  });
});

describe("remainingSteps", () => {
  it("is the whole path for a new user", () => {
    expect(remainingSteps("plan", null, NONE, FRESH, false)).toEqual(planSteps());
    expect(remainingSteps("history", "import", NONE, FRESH, false)).toEqual(historySteps("import"));
  });

  it.each([
    [{ workouts: true }, ["P1", "P3", "P4", "P5", "P6", "P7"]],
    [{ blockMemberships: true }, ["P2", "P4", "P5", "P6", "P7"]],
    [{ scheduledBlocks: true }, ["P1", "P2", "P3", "P5", "P6", "P7"]],
    [{ workouts: true, blockMemberships: true, scheduledBlocks: true }, ["P5", "P6", "P7"]],
    [{ exercises: true, sessions: true }, ["P1", "P2", "P3", "P4", "P5", "P6", "P7"]],
  ])("drops the plan steps the data already holds: %o", (done, steps) => {
    expect(remainingSteps("plan", null, { ...NONE, ...done }, FRESH, false)).toEqual(steps);
  });

  it("reopens a finished history path on adding climbs, whatever the way", () => {
    const progress = { ...NONE, sessions: true };
    for (const way of ["import", "by_hand", null] as const)
      expect(remainingSteps("history", way, progress, FRESH, false)).toEqual([
        "H2h",
        "H4",
        "H5",
        "H6",
      ]);
  });

  it("drops the membership offer for a member", () => {
    expect(remainingSteps("history", "by_hand", NONE, FRESH, true)).toEqual([
      "H1",
      "H2h",
      "H4",
      "H6",
    ]);
    expect(remainingSteps("plan", null, NONE, FRESH, true)).not.toContain("P6");
  });

  it("shows no membership panel at the second path's end once the first showed it", () => {
    expect(remainingSteps("plan", null, NONE, SHOWN, false)).toEqual([
      "P1",
      "P2",
      "P3",
      "P4",
      "P5",
      "P7",
    ]);
    expect(remainingSteps("history", "import", NONE, SHOWN, false)).toEqual([
      "H1",
      "H2i",
      "H3i",
      "H4",
      "H6",
    ]);
  });
});

describe("resumeStep", () => {
  it("is the first step not done", () => {
    expect(resumeStep("history", null, NONE, FRESH, false)).toBe("H1");
    expect(resumeStep("history", null, { ...NONE, sessions: true }, FRESH, false)).toBe("H2h");
    expect(resumeStep("plan", null, { ...NONE, blockMemberships: true }, FRESH, false)).toBe("P2");
    expect(
      resumeStep(
        "plan",
        null,
        { ...NONE, workouts: true, blockMemberships: true, scheduledBlocks: true },
        SHOWN,
        true
      )
    ).toBe("P5");
  });
});

describe("stepPosition on the plan path", () => {
  const all = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"] as const;
  const member = ["P1", "P2", "P3", "P4", "P5", "P7"] as const;
  it("counts six fixed stages, the membership offer the sixth", () => {
    expect(stepPosition("plan", "P5", all)).toEqual({ n: 5, total: 6 });
    expect(stepPosition("plan", "P6", all)).toEqual({ n: 6, total: 6 });
  });
  it("keeps six for a member who never sees the offer", () => {
    expect(stepPosition("plan", "P5", member)).toEqual({ n: 5, total: 6 });
  });
});
