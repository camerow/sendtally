import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { Exercise } from "../activities/detail";
import { epley, exerciseSeries, exerciseSummary } from "./exercises";

const TODAY = "2026-10-22";

function logged(id: string, date: string, exercises: Exercise[]): Activity {
  return {
    id,
    kind: "strength",
    title: "Gym",
    date,
    startTime: null,
    minutes: 60,
    rpe: null,
    notes: null,
    planItemId: null,
    workoutId: null,
    detail: { kind: "sets", exercises },
  };
}

const squat = (sets: Exercise["sets"], name = "Squat"): Exercise => ({
  name,
  measures: ["reps", "loadKg"],
  sets,
});

describe("exerciseSeries", () => {
  it("matches names trimmed and case-insensitively, oldest session first, newest spelling", () => {
    const [series] = exerciseSeries([
      logged("b", "2026-10-08", [squat([{ reps: 5, loadKg: 100, done: true }], " squat ")]),
      logged("a", "2026-10-01", [squat([{ reps: 5, loadKg: 90, done: true }])]),
    ]);
    expect(series?.name).toBe("squat");
    expect(series?.sessions.map((s) => s.activityId)).toEqual(["a", "b"]);
  });

  it("takes the heaviest done set with its reps, e1RM and volume, ignoring undone sets", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-10-01", [
        squat([
          { reps: 5, loadKg: 100, done: true },
          { reps: 8, loadKg: 100, done: true },
          { reps: 3, loadKg: 120, done: false },
        ]),
      ]),
    ]);
    const session = series?.sessions[0];
    expect(session?.best).toEqual({ reps: 8, loadKg: 100 });
    expect(session?.attempted).toBe(false);
    expect(session?.e1rmKg).toBeCloseTo(100 * (1 + 8 / 30));
    expect(session?.volumeKg).toBe(1300);
  });

  it("keeps a session with nothing done as an attempt at its best try", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-10-01", [squat([{ reps: 3, loadKg: 120, done: false }])]),
    ]);
    expect(series?.sessions[0]).toMatchObject({ value: 120, attempted: true, volumeKg: 0 });
  });

  it("judges holds on seconds and splits sides", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-10-01", [
        {
          name: "Side plank",
          measures: ["seconds", "side"],
          sets: [
            { seconds: 40, side: "L", done: true },
            { seconds: 30, side: "R", done: true },
          ],
        },
      ]),
    ]);
    expect(series?.metric).toBe("seconds");
    expect(series?.sessions[0]).toMatchObject({ value: 40, sides: { L: 40, R: 30 } });
  });

  it("orders exercises by how often they were logged", () => {
    const pullUps: Exercise = {
      name: "Pull-ups",
      measures: ["reps"],
      sets: [{ reps: 10, done: true }],
    };
    const series = exerciseSeries([
      logged("a", "2026-10-01", [squat([{ reps: 5, loadKg: 90, done: true }]), pullUps]),
      logged("b", "2026-10-08", [pullUps]),
    ]);
    expect(series.map((s) => [s.name, s.metric])).toEqual([
      ["Pull-ups", "reps"],
      ["Squat", "load"],
    ]);
  });
});

describe("exerciseSummary", () => {
  it("counts done sessions, the best, the change and this month's volume", () => {
    const [series] = exerciseSeries([
      logged("a", "2026-09-10", [squat([{ reps: 5, loadKg: 90, done: true }])]),
      logged("b", "2026-10-01", [squat([{ reps: 5, loadKg: 105, done: true }])]),
      logged("c", "2026-10-08", [squat([{ reps: 5, loadKg: 100, done: true }])]),
      logged("d", "2026-10-15", [squat([{ reps: 1, loadKg: 130, done: false }])]),
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
    expect(summary?.latest.activityId).toBe("d");
  });
});
