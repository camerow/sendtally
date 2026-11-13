import { describe, expect, it } from "vitest";
import type { Block } from "@sendtally/core/hang";
import { bandOn, bandText, blockOn, calendarDay, monthWeeks } from "./calendarGrid";

const autumn: Block = {
  id: "b1",
  name: "Autumn power",
  start: "2026-09-28",
  weeks: 4,
  focus: null,
};

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

describe("calendar labels and days", () => {
  it("names the block over a week, and nothing outside one", () => {
    expect(bandText([autumn], "2026-10-05")).toBe("Autumn power · 2/4");
    expect(bandText([autumn], "2026-11-02")).toBeNull();
  });

  it("marks a day off outside its bounds, and on when picked or selected", () => {
    const bounds = { selected: "2026-10-10", min: "2026-10-05", max: "2026-10-20" };
    expect(calendarDay("2026-10-04", bounds)).toEqual({ off: true, on: false });
    expect(calendarDay("2026-10-10", bounds)).toEqual({ off: false, on: true });
    expect(calendarDay("2026-10-21", bounds)).toEqual({ off: true, on: false });
    expect(calendarDay("2026-10-12", { ...bounds, picked: ["2026-10-12"] })).toEqual({
      off: false,
      on: true,
    });
  });
});
