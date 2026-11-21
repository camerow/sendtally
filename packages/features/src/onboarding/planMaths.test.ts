import { describe, expect, it } from "vitest";
import type { LibraryWorkout } from "../workouts/types";
import {
  firstWeekday,
  nextMonday,
  sessionsPerWeek,
  shortcutChanges,
  shortcutOf,
  weekBars,
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

describe("weekBars", () => {
  const workout = (items: LibraryWorkout["items"]): LibraryWorkout => ({
    id: "w",
    kind: "strength",
    name: "Pull day",
    description: "",
    minutes: null,
    targetRpe: null,
    items,
    exerciseRestS: 0,
    focus: null,
    source: "mine",
  });
  const pull = workout([
    { id: "a", exercise: "Plank", doses: [{ sets: 3, reps: 10 }] },
    { id: "b", exercise: "Weighted pull-up", doses: [{ sets: 3, reps: 5, weightKg: 20 }] },
  ]);
  const name = (id: string): string => id;
  const step = (week: number, weightKg: number) => ({
    membershipId: "m",
    week,
    dose: 0,
    itemId: "b",
    change: { weightKg },
  });

  it("draws the first weighted item's weeks with their changes", () => {
    expect(weekBars(pull, "m", 3, [step(2, 22.5), step(3, 25)], "kg", name)).toEqual({
      name: "Weighted pull-up",
      bars: [
        { label: "20 kg", value: 300, deload: false },
        { label: "22.5 kg", value: 337.5, deload: false },
        { label: "25 kg", value: 375, deload: false },
      ],
    });
  });
  it("marks a last week lighter than the one before as the deload", () => {
    const bars = weekBars(pull, "m", 3, [step(2, 22.5), step(3, 16)], "kg", name)?.bars;
    expect(bars?.map((b) => b.deload)).toEqual([false, false, true]);
  });
  it("counts reps when no item carries weight", () => {
    const bodyweight = workout([{ id: "a", exercise: "Plank", doses: [{ sets: 3, reps: 10 }] }]);
    expect(weekBars(bodyweight, "m", 1, [], "kg", name)?.bars).toEqual([
      { label: "10 reps", value: 300, deload: false },
    ]);
  });
  it("is null for a workout with nothing to draw", () => {
    expect(weekBars(workout([]), "m", 3, [], "kg", name)).toBeNull();
  });
});
