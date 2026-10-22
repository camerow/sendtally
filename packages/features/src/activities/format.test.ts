import { describe, expect, it } from "vitest";
import { activityAt, activityEffortLabel, activityMetaLabel, kindLabel } from "./format";

describe("activity labels", () => {
  it("names the kind and the time spent", () => {
    expect(kindLabel("climb")).toBe("Climbing");
    expect(activityMetaLabel({ kind: "strength", minutes: 50, detail: null })).toBe(
      "Strength · 50m"
    );
    expect(activityMetaLabel({ kind: "run", minutes: 90, detail: null })).toBe("Run · 1h 30m");
  });

  it("adds its body's summary", () => {
    const checklist = {
      kind: "checklist" as const,
      items: [
        { text: "Cat-cow", dose: "× 10", done: true },
        { text: "Deep squat hold", dose: "2 min", done: false },
      ],
    };
    expect(activityMetaLabel({ kind: "mobility", minutes: 15, detail: checklist })).toBe(
      "Mobility · 15m · 1 of 2 done"
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
