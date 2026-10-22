import { describe, expect, it, jest } from "@jest/globals";
import type { IntervalsRun } from "./intervalsParams";
import { intervalsPath, readIntervalsParams } from "./intervalsParams";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const run: IntervalsRun = {
  kind: "strength",
  title: "Kettlebell EMOM",
  date: "2026-10-22",
  planItemId: null,
  activityId: "a1",
  workoutId: null,
  body: {
    kind: "intervals",
    rounds: 10,
    steps: [{ label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 45 }],
  },
};

describe("intervals route params", () => {
  it("carries a run through its route and back", () => {
    const href = intervalsPath(run);
    if (typeof href === "string") throw new Error("expected an object href");
    expect(readIntervalsParams(href.params as Record<string, string>)).toEqual(run);
  });

  it("reads no run from params that do not hold one", () => {
    expect(readIntervalsParams({ kind: "strength", body: "{" })).toBeNull();
    expect(readIntervalsParams({ kind: "climb", body: JSON.stringify(run.body) })).toBeNull();
    expect(
      readIntervalsParams({ kind: "run", body: JSON.stringify({ ...run.body, steps: [] }) })
    ).toBeNull();
  });
});
