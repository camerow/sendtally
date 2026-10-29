import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { GradeScale } from "@sendtally/core";
import type { ItemDone, SetClimb, SetDone } from "@sendtally/core/hang";
import { epley, exerciseSeries, exerciseSummary, workoutsUsing } from "./exercises";

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

describe("grade metrics", () => {
  const climb = (grade: string, sent = true, scale: GradeScale = "v"): SetClimb => ({
    grade,
    scale,
    tries: 1,
    sent,
  });
  const limit = (...climbs: SetClimb[]): ItemDone => item("Limit boulders", [{ climbs }]);
  const sessions = [
    logged("a", "2026-10-01", [limit(climb("V3"), climb("V5"), climb("V7", false))]),
    logged("b", "2026-10-08", [limit(climb("V4"), climb("V6"), climb(""))]),
  ];

  it("reads the average and highest grade sent per session, leaving out falls and circuits", () => {
    const [top] = exerciseSeries(sessions, () => "topGrade");
    const [average] = exerciseSeries(sessions, () => "averageGrade");
    expect(top?.metric).toBe("topGrade");
    expect(top?.sessions.map((s) => s.value)).toEqual([5, 6]);
    expect(average?.sessions.map((s) => s.value)).toEqual([4, 5]);
    expect(average?.grades?.average(4.5)).toBe("V4.5");
    expect(top === undefined ? null : exerciseSummary(top, TODAY)).toMatchObject({ change: 1 });
  });

  it("counts sends when the progress is the climbs completed or unset", () => {
    expect(exerciseSeries(sessions)[0]?.metric).toBe("sends");
    expect(exerciseSeries(sessions, () => null)[0]?.metric).toBe("sends");
    expect(exerciseSeries(sessions, () => "completed")[0]?.metric).toBe("sends");
  });

  it("marks an exercise with no progress untracked, still logged", () => {
    const [series] = exerciseSeries(sessions, () => "none");
    expect(series).toMatchObject({ metric: "sends", untracked: true });
    expect(series?.sessions).toHaveLength(2);
  });

  it("ranks routes on their own ladder and reads them in the scale logged", () => {
    const routes = limit(climb("6a", true, "french"), climb("V9"), climb("6c", true, "french"));
    const [series] = exerciseSeries([logged("a", "2026-10-01", [routes])], () => "topGrade");
    expect(series?.grades?.label(series.sessions[0]?.value ?? -1)).toBe("6c");
  });

  it("drops a session with nothing sent at a grade", () => {
    const fell = logged("c", "2026-10-15", [limit(climb("V8", false))]);
    const [series] = exerciseSeries([...sessions, fell], () => "averageGrade");
    expect(series?.sessions.map((s) => s.activityId)).toEqual(["a", "b"]);
  });
});

describe("workoutsUsing", () => {
  it("finds the workouts naming the exercise in any case, never by a grip id", () => {
    const w = (kind: "strength" | "hangboard", exercise: string) => ({
      kind,
      items: [{ exercise, doses: [{ sets: 1 }] }],
    });
    const legs = w("strength", " back Squat");
    expect(
      workoutsUsing([legs, w("strength", "Plank"), w("hangboard", "back squat")], "Back squat")
    ).toEqual([legs]);
  });
});
