import { describe, expect, it } from "vitest";
import { historyNextLine, setupPaths } from "./setupPaths";
import type { OnboardingProgress, OnboardingStatus } from "./types";

const NONE: OnboardingProgress = {
  sessions: false,
  exercises: false,
  workouts: false,
  blockMemberships: false,
  scheduledBlocks: false,
};
const status = (o: Partial<OnboardingStatus> = {}): OnboardingStatus => ({
  path: null,
  left: false,
  progress: NONE,
  ...o,
});
const kept = (): boolean => false;

describe("setupPaths", () => {
  it("offers both paths to a new account, climbing first", () => {
    expect(setupPaths(status(), kept)).toEqual([
      { path: "history", resume: false },
      { path: "plan", resume: false },
    ]);
  });

  it("drops a path once its data exists", () => {
    const done = status({ progress: { ...NONE, sessions: true, scheduledBlocks: true } });
    expect(setupPaths(done, kept)).toEqual([]);
  });

  it("drops a path dismissed on this device", () => {
    expect(setupPaths(status(), (p) => p === "plan")).toEqual([{ path: "history", resume: false }]);
  });

  it("turns a path left mid-way into Finish setting up, even after an earlier Not now", () => {
    expect(setupPaths(status({ path: "plan", left: true }), () => true)).toEqual([
      { path: "plan", resume: true },
    ]);
  });

  it("resumes a path left after its first save, so climbs already added are counted", () => {
    const left = status({ path: "history", left: true, progress: { ...NONE, sessions: true } });
    expect(setupPaths(left, kept)).toEqual([
      { path: "history", resume: true },
      { path: "plan", resume: false },
    ]);
  });

  it("does not resume a path the wizard is still open on", () => {
    expect(setupPaths(status({ path: "history" }), kept)[0]).toEqual({
      path: "history",
      resume: false,
    });
  });
});

describe("historyNextLine", () => {
  it("starts the pyramid, then says what the next climbs unlock, then invites more once all of it shows", () => {
    expect(historyNextLine(0)).toBe("Add a climb and your pyramid starts here.");
    expect(historyNextLine(1)).toBe("2 more and you get your average send.");
    expect(historyNextLine(4)).toBe("1 more draws your hardest send, year by year.");
    expect(historyNextLine(5)).toBe("Add more climbs, or see it all.");
  });
});
