import { describe, expect, it } from "vitest";
import { setupPaths } from "./setupPaths";
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

  it("does not resume a path the wizard is still open on", () => {
    expect(setupPaths(status({ path: "history" }), kept)[0]).toEqual({
      path: "history",
      resume: false,
    });
  });
});
