import { describe, expect, it } from "vitest";
import {
  blockEnd,
  clampWeekLoad,
  blockWeekOn,
  evenWeekLoads,
  weekLoadOn,
  nextPhase,
  phaseOn,
  resizeWeekLoads,
  stepWeekLoad,
  withShape,
} from "./block";
import type { TrainingBlock } from "./types";

const block: TrainingBlock = {
  id: "b",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 4,
  loads: [{ load: 100 }, { load: 110 }, { load: 120, phase: "test" }, { load: 70 }],
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

  it("gives the phase and load of the week a date falls in", () => {
    expect(phaseOn(block, "2026-10-12")).toBe("test");
    expect(phaseOn(block, "2026-10-20")).toBeNull();
    expect(weekLoadOn(block, "2026-10-06")).toBe(110);
    expect(weekLoadOn(block, "2026-10-20")).toBe(70);
    expect(weekLoadOn({ ...block, endedOn: "2026-10-19" }, "2026-10-20")).toBeNull();
  });

  it("starts every week at the base load with no phase, whatever the length", () => {
    expect(evenWeekLoads(2)).toEqual([{ load: 100 }, { load: 100 }]);
    expect(evenWeekLoads(6).every((w) => w.load === 100 && w.phase === undefined)).toBe(true);
  });

  it("keeps weeks when resized, and carries the last load into new weeks", () => {
    const loads = [{ load: 90, phase: "deload" as const }, { load: 115 }];
    expect(resizeWeekLoads(loads, 4)).toEqual([...loads, { load: 115 }, { load: 115 }]);
    expect(resizeWeekLoads(loads, 1)).toEqual([loads[0]]);
    expect(resizeWeekLoads([], 1)).toEqual([{ load: 100 }]);
  });

  it("steps load by five within its range", () => {
    expect(stepWeekLoad(100, 1)).toBe(105);
    expect(stepWeekLoad(100, -1)).toBe(95);
    expect(stepWeekLoad(150, 1)).toBe(150);
    expect(stepWeekLoad(50, -1)).toBe(50);
    expect(clampWeekLoad(112)).toBe(110);
    expect(clampWeekLoad(400)).toBe(150);
  });

  it("fills preset shapes, keeping each week's phase", () => {
    const loads = resizeWeekLoads([{ load: 130, phase: "test" }], 5);
    const values = (shape: Parameters<typeof withShape>[1]): number[] =>
      withShape(loads, shape).map((w) => w.load);
    expect(values("flat")).toEqual([100, 100, 100, 100, 100]);
    expect(values("ramp")).toEqual([90, 100, 105, 115, 120]);
    expect(values("taper")).toEqual([90, 100, 110, 120, 60]);
    expect(values("wave")).toEqual([90, 105, 120, 105, 90]);
    expect(withShape(loads, "flat")[0]?.phase).toBe("test");
    expect(withShape([{ load: 120 }], "taper")).toEqual([{ load: 100 }]);
  });

  it("cycles a week from no phase through each phase and back", () => {
    expect(nextPhase(undefined)).toBe("load");
    expect(nextPhase("load")).toBe("deload");
    expect(nextPhase("deload")).toBe("test");
    expect(nextPhase("test")).toBe("perform");
    expect(nextPhase("perform")).toBeUndefined();
  });
});
