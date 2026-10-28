import { describe, expect, it } from "@jest/globals";
import type { Block } from "@sendtally/core/hang";
import { bandOn, blockOn, monthWeeks } from "./calendarGrid";

const autumn: Block = { id: "b1", name: "Autumn power", start: "2026-09-28", weeks: 4 };

describe("calendar grid", () => {
  it("lists the Monday of every week a month touches", () => {
    expect(monthWeeks("2026-10-01")).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);
    expect(monthWeeks("2026-11-01")).toEqual([
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
      "2026-11-23",
      "2026-11-30",
    ]);
  });

  it("bands a week with its block and week number", () => {
    expect(bandOn([autumn], "2026-10-19")).toEqual({ block: autumn, week: 4 });
    expect(bandOn([autumn], "2026-10-26")).toBeNull();
    const midweek = { ...autumn, start: "2026-10-01" };
    expect(bandOn([midweek], "2026-09-28")).toEqual({ block: midweek, week: 1 });
  });

  it("finds the block a day falls in", () => {
    expect(blockOn([autumn], "2026-10-25")?.id).toBe("b1");
    expect(blockOn([autumn], "2026-10-26")).toBeNull();
  });
});
