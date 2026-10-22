import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { ItemDone, SetDone } from "@sendtally/core/hang";
import { epley, exerciseSeries, exerciseSummary } from "./exercises";

const TODAY = "2026-10-22";

function logged(id: string, date: string, done: ItemDone[]): Activity {
  return {
    id,
    kind: "strength",
    title: "Gym",
    date,
    startTime: null,
    minutes: 60,
    rpe: null,
    notes: null,
    workoutId: null,
    membershipId: null,
    week: null,
    variation: null,
    done,
  };
}

const item = (exercise: string, sets: SetDone[]): ItemDone => ({ item: 0, exercise, sets });

const squat = (sets: SetDone[], name = "Squat"): ItemDone => item(name, sets);

describe("exerciseSeries", () => {
  it("matches names trimmed and case-insensitively, oldest session first, newest spelling", () => {
    const [series] = exerciseSeries([
      logged("b", "2026-10-08", [squat([{ reps: 5, weightKg: 100 }], " squat ")]),
      logged("a", "2026-10-01", [squat([{ reps: 5, weightKg: 90 }])]),
    ]);
    expect(series?.name).toBe("squat");
    expect(series?.sessions.map((s) => s.activityId)).toEqual(["a", "b"]);
  });

  it("takes the heaviest set with its reps, e1RM and volume", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-10-01", [
        squat([
          { reps: 5, weightKg: 100 },
          { reps: 8, weightKg: 100 },
        ]),
      ]),
    ]);
    const session = series?.sessions[0];
    expect(session?.best).toEqual({ reps: 8, weightKg: 100 });
    expect(session?.e1rmKg).toBeCloseTo(100 * (1 + 8 / 30));
    expect(session?.volumeKg).toBe(1300);
  });

  it("leaves out an item with no sets done", () => {
    expect(exerciseSeries([logged("a", "2026-10-01", [squat([])])])).toEqual([]);
  });

  it("judges holds on seconds", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-10-01", [item("Side plank", [{ onS: 40 }, { onS: 30 }])]),
    ]);
    expect(series?.metric).toBe("seconds");
    expect(series?.sessions[0]).toMatchObject({ value: 40 });
  });

  it("orders exercises by how often they were logged", () => {
    const pullUps = item("Pull-ups", [{ reps: 10 }]);
    const series = exerciseSeries([
      logged("a", "2026-10-01", [squat([{ reps: 5, weightKg: 90 }]), pullUps]),
      logged("b", "2026-10-08", [pullUps]),
    ]);
    expect(series.map((s) => [s.name, s.metric])).toEqual([
      ["Pull-ups", "reps"],
      ["Squat", "load"],
    ]);
  });
});

describe("exerciseSummary", () => {
  it("counts sessions, the best, the change and this month's volume", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-09-10", [squat([{ reps: 5, weightKg: 90 }])]),
      logged("b", "2026-10-01", [squat([{ reps: 5, weightKg: 105 }])]),
      logged("c", "2026-10-08", [squat([{ reps: 5, weightKg: 100 }])]),
    ]);
    const summary = series === undefined ? null : exerciseSummary(series, TODAY);
    expect(summary).toMatchObject({
      sessions: 3,
      change: 10,
      weeks: 4,
      volumeThisMonthKg: 1025,
      e1rmKg: epley(105, 5),
    });
    expect(summary?.best?.activityId).toBe("b");
    expect(summary?.latest.activityId).toBe("c");
  });
});
