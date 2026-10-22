import { describe, expect, it } from "vitest";
import { activityAt, activityEffortLabel, activityMetaLabel, kindLabel } from "./format";

describe("activity labels", () => {
  it("names the kind and the time spent", () => {
    expect(kindLabel("climbing")).toBe("Climbing");
    expect(kindLabel("hangboard")).toBe("Hangboard");
    expect(activityMetaLabel({ kind: "strength", minutes: 50, done: [] })).toBe("Strength · 50m");
    expect(activityMetaLabel({ kind: "other", minutes: 90, done: [] })).toBe("Other · 1h 30m");
  });

  it("adds what was done", () => {
    const done = [
      { item: 0, exercise: "Cat-cow", sets: [{ reps: 10 }, { reps: 10 }] },
      { item: 1, exercise: "Deep squat hold", sets: [] },
    ];
    expect(activityMetaLabel({ kind: "mobility", minutes: 15, done })).toBe(
      "Mobility · 15m · 1 exercise · 2 sets"
    );
  });

  it("sorts at the start time, or midday without one", () => {
    expect(activityAt({ date: "2026-10-01", startTime: "18:30" })).toBe("2026-10-01T18:30:00Z");
    expect(activityAt({ date: "2026-10-01", startTime: null })).toBe("2026-10-01T12:00:00Z");
  });

  it("shows effort only when it was given", () => {
    expect(activityEffortLabel({ rpe: 6 })).toBe("RPE 6");
    expect(activityEffortLabel({ rpe: null })).toBeNull();
  });
});
