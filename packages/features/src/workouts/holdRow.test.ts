import { describe, expect, it } from "vitest";
import type { Hold } from "./holdClock";
import { holdRowVM, restRowVM, stripVM } from "./holdRow";
import type { Rest } from "./restCountdown";

const hold = (over: Partial<Hold> = {}): Hold => ({
  at: "0:0",
  name: "Plank",
  targetS: 30,
  sides: false,
  zeroAt: 10_000,
  pausedAt: null,
  ...over,
});

describe("a hold's row", () => {
  it("counts in, then counts up toward its target", () => {
    expect(holdRowVM(hold(), 8_000)).toMatchObject({
      word: "Ready",
      clock: "2",
      share: 0,
      of: null,
    });
    const held = holdRowVM(hold(), 25_000);
    expect(held).toMatchObject({ word: null, clock: "0:15", share: 0.5, of: "of 0:30" });
    expect(held.label).toBe("0:15 of 0:30");
  });

  it("names the side on a hold done each side, and fills once over", () => {
    expect(holdRowVM(hold({ sides: true }), 15_000).word).toBe("Left");
    expect(holdRowVM(hold(), 60_000)).toMatchObject({ clock: "0:30", share: 1 });
    expect(holdRowVM(hold({ pausedAt: 12_000 }), 12_000).paused).toBe(true);
  });
});

describe("a rest's row", () => {
  it("drains toward zero and says what is next", () => {
    const rest = { at: "after:0", seconds: 90, next: "Ring row", endsAt: 0 } as unknown as Rest;
    expect(restRowVM(rest, 45)).toEqual({
      clock: "0:45",
      share: 0.5,
      next: "Next: Ring row",
      label: "Rest, 0:45 left",
    });
  });
});

describe("the live bar's strip", () => {
  it("says what a rest is before, and leaves at zero", () => {
    const rest = { at: "0:0", seconds: 90, endsAt: 90_000, next: null };
    expect(stripVM(rest, 90, null, 0)).toMatchObject({
      kind: "rest",
      text: "Rest 1:30",
      then: "· then set 2",
      share: 1,
    });
    expect(stripVM({ ...rest, at: "after:0", next: "Row" }, 45, null, 0)?.then).toBe("· then Row");
    expect(stripVM(rest, 0, null, 0)).toBeNull();
  });
});
