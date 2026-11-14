import { describe, expect, it } from "vitest";
import {
  doneParams,
  intervalsParams,
  readDoneParams,
  readIntervalsParams,
  readWorkoutRun,
  runParams,
  type DoneParams,
  type IntervalsRun,
  type WorkoutRun,
} from "./runParams";

const run: IntervalsRun = {
  kind: "strength",
  title: "Kettlebell EMOM",
  date: "2026-10-22",
  workoutId: null,
  link: { membershipId: "m1", week: null, focus: null },
  body: {
    rounds: 10,
    steps: [{ label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 45 }],
  },
};

describe("intervals route params", () => {
  it("carries a run through its route and back", () => {
    expect(readIntervalsParams(intervalsParams(run))).toEqual(run);
  });

  it("reads no run from params that do not hold one", () => {
    expect(readIntervalsParams({ kind: "strength", body: "{" })).toBeNull();
    expect(readIntervalsParams({ kind: "climb", body: JSON.stringify(run.body) })).toBeNull();
    expect(
      readIntervalsParams({ kind: "other", body: JSON.stringify({ ...run.body, steps: [] }) })
    ).toBeNull();
  });
});

describe("workout run params", () => {
  const run: WorkoutRun = {
    kind: "strength",
    title: "Leg day",
    date: "2026-10-22",
    workoutId: "w1",
    link: { membershipId: "m1", week: 2, focus: null },
    minutes: 50,
    exerciseRestS: 120,
    items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }],
  };

  it("carries a run through its params and back", () => {
    expect(readWorkoutRun(runParams(run))).toEqual(run);
  });

  it("reads no run without items or a workout", () => {
    expect(readWorkoutRun({ ...runParams(run), items: "[]" })).toBeNull();
    expect(readWorkoutRun({ ...runParams(run), workoutId: "" })).toBeNull();
  });
});

describe("hangboard review params", () => {
  const review: DoneParams = {
    workoutId: "w1",
    gripId: "half",
    link: { membershipId: null, week: null, focus: null },
    session: 2,
    run: { done: [], off: ["0:1"], setups: [{ edgeMm: 20, loadKg: 5 }], startedAt: 1000 },
  };

  it("carries a review through its params and back", () => {
    expect(readDoneParams(doneParams(review))).toEqual(review);
    expect(readDoneParams(doneParams({ ...review, run: null }))).toEqual({ ...review, run: null });
  });
});
