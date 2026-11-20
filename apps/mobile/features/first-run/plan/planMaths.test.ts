import { describe, expect, it } from "@jest/globals";
import {
  firstWeekday,
  nextMonday,
  sessionsPerWeek,
  shortcutChanges,
  shortcutOf,
} from "./planMaths";

describe("shortcutChanges", () => {
  const written = { sets: 3, reps: 5, weightKg: 50 };
  it("steps the weight up from week two and deloads the last week", () => {
    const weeks = shortcutChanges(written, 4, { stepUp: true, deload: true }, "kg");
    expect(weeks[0]).toEqual({});
    expect(weeks[1]).toEqual({ weightKg: 52.5 });
    expect(weeks[2]).toEqual({ weightKg: 55 });
    expect(weeks[3]).toEqual({ sets: 2, weightKg: 40 });
  });
  it("adds reps when there is no weight", () => {
    const weeks = shortcutChanges({ sets: 3, reps: 5 }, 3, { stepUp: true, deload: false }, "lb");
    expect(weeks.map((w) => w.reps)).toEqual([undefined, 6, 7]);
  });
  it("leaves every week as written with no shortcut", () => {
    expect(shortcutChanges(written, 3, { stepUp: false, deload: false }, "kg")).toEqual([
      {},
      {},
      {},
    ]);
  });
});

describe("plan maths", () => {
  it("starts on the next Monday, or today when it is one", () => {
    expect(nextMonday("2026-11-20")).toBe("2026-11-23");
    expect(nextMonday("2026-11-23")).toBe("2026-11-23");
  });
  it("counts sessions and finds the first day", () => {
    const days = { a: [1, 3] as const, b: [5] as const };
    expect(sessionsPerWeek(days)).toBe(3);
    expect(firstWeekday(days)).toBe(1);
    expect(firstWeekday({})).toBeNull();
    expect(shortcutOf({ stepUp: true, deload: false })).toBe("step_up");
  });
});
