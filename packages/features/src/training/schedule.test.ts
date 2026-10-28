import { describe, expect, it } from "vitest";
import type { Block, Membership } from "@sendtally/core/hang";
import { movedTo, newSchedule, scheduledMemberships, scheduleReady, toggled } from "./schedule";

const TODAY = "2026-10-22";
const block: Block = { id: "b1", name: "Winter base", start: "2026-11-02", weeks: 6, focus: null };

const ids = (): (() => string) => {
  let n = 0;
  return () => `m${++n}`;
};

describe("newSchedule", () => {
  it("opens on the weekday and date it was asked from", () => {
    expect(newSchedule("2026-11-05", TODAY)).toEqual({
      mode: "repeat",
      weekdays: [3],
      dates: ["2026-11-05"],
      start: "2026-11-05",
    });
  });

  it("starts today with nothing picked, and never offers a past date", () => {
    expect(newSchedule(null, TODAY)).toMatchObject({ weekdays: [], dates: [], start: TODAY });
    expect(newSchedule("2026-10-19", TODAY)).toMatchObject({ dates: [], start: TODAY });
  });
});

describe("toggled", () => {
  it("adds in order and takes out", () => {
    expect(toggled([3, 0], 1)).toEqual([0, 1, 3]);
    expect(toggled([0, 1, 3], 1)).toEqual([0, 3]);
  });
});

describe("scheduledMemberships", () => {
  const draft = newSchedule(null, TODAY);

  it("saves one weekly plan, from the block's start inside a block", () => {
    const weekly = { ...draft, weekdays: [3, 0] as (0 | 3)[] };
    expect(scheduledMemberships(weekly, "w1", null, ids())).toEqual([
      { id: "m1", workoutId: "w1", blockId: null, weekdays: [0, 3], start: TODAY },
    ]);
    expect(scheduledMemberships(weekly, "w1", block, ids())).toEqual([
      { id: "m1", workoutId: "w1", blockId: "b1", weekdays: [0, 3], start: "2026-11-02" },
    ]);
  });

  it("saves a one-off per date, leaving out dates the block does not hold", () => {
    const dates = { ...draft, mode: "dates" as const, dates: ["2026-11-10", "2026-10-28"] };
    expect(scheduledMemberships(dates, "w1", null, ids())).toEqual([
      { id: "m1", workoutId: "w1", blockId: null, weekdays: [], start: "2026-10-28" },
      { id: "m2", workoutId: "w1", blockId: null, weekdays: [], start: "2026-11-10" },
    ]);
    expect(scheduledMemberships(dates, "w1", block, ids())).toEqual([
      { id: "m1", workoutId: "w1", blockId: "b1", weekdays: [], start: "2026-11-10" },
    ]);
  });

  it("is ready once it says when", () => {
    expect(scheduleReady(draft, null)).toBe(false);
    expect(scheduleReady({ ...draft, weekdays: [1] }, null)).toBe(true);
    const outside = { ...draft, mode: "dates" as const, dates: ["2026-10-28"] };
    expect(scheduleReady(outside, null)).toBe(true);
    expect(scheduleReady(outside, block)).toBe(false);
  });
});

describe("movedTo", () => {
  const weekly: Membership = {
    id: "m1",
    workoutId: "w1",
    blockId: null,
    weekdays: [0],
    start: "2026-10-01",
  };

  it("starts with the block it moves into", () => {
    expect(movedTo(weekly, block, null, TODAY)).toMatchObject({
      blockId: "b1",
      start: "2026-11-02",
    });
  });

  it("runs on from today, or the block's start, when it moves out", () => {
    const inBlock = { ...weekly, blockId: "b1", start: block.start };
    expect(movedTo(inBlock, null, block, TODAY)).toMatchObject({
      blockId: null,
      start: "2026-11-02",
    });
    expect(movedTo(inBlock, null, block, "2026-11-20")).toMatchObject({ start: "2026-11-20" });
  });

  it("keeps a one-off's date", () => {
    const once = { ...weekly, weekdays: [], start: "2026-11-10" };
    expect(movedTo(once, block, null, TODAY)).toEqual({ ...once, blockId: "b1" });
  });
});
