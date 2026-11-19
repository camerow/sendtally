import { describe, expect, it } from "vitest";
import type { Occurrence } from "./plan";
import { occurrenceMeta } from "./occurrenceText";

const strength = {
  id: "w",
  kind: "strength",
  name: "Strength A",
  minutes: 60,
  targetRpe: 8,
  exerciseRestS: 180,
  items: [
    {
      exercise: "Deadlift",
      doses: [
        { sets: 2, reps: 2 },
        { sets: 2, reps: 5 },
      ],
    },
  ],
};

const on = (workout: object, movedFrom: string | null = null): Occurrence =>
  ({ workout, session: 1, items: [], movedFrom }) as unknown as Occurrence;

describe("a planned run's line", () => {
  it("says the session's length and Target RPE, never a dose or the alternate's letter", () => {
    expect(occurrenceMeta(on(strength))).toBe("60 min · Target RPE 8/10");
    expect(occurrenceMeta(on({ ...strength, targetRpe: null }))).toBe("60 min");
  });

  it("keeps where a moved run came from", () => {
    expect(occurrenceMeta(on(strength, "2026-11-16"))).toBe(
      "Rescheduled from Mon · 60 min · Target RPE 8/10"
    );
  });
});
