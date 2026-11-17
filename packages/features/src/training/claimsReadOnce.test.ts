import { describe, expect, it, vi } from "vitest";
import * as core from "@sendtally/core/hang";
import { trainingWeek, type TrainingLog } from "./days";

vi.mock("@sendtally/core/hang", async (actual) => {
  const real = await actual<typeof core>();
  return { ...real, withClaimedMoves: vi.fn(real.withClaimedMoves) };
});

const log: TrainingLog = {
  climbs: [],
  hangs: [],
  activities: [],
  plan: { blocks: [], memberships: [], weekChanges: [], planChanges: [], membershipDays: [] },
  workout: () => undefined,
};

describe("the moves a log claims", () => {
  it("are worked out once per log, not once per day read", () => {
    trainingWeek(log, "2026-11-16", "2026-11-16");
    trainingWeek(log, "2026-11-23", "2026-11-16");
    expect(core.withClaimedMoves).toHaveBeenCalledTimes(1);
    trainingWeek({ ...log }, "2026-11-16", "2026-11-16");
    expect(core.withClaimedMoves).toHaveBeenCalledTimes(2);
  });
});
