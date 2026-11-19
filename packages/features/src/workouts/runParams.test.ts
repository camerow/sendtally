import { describe, expect, it } from "vitest";
import { readSession } from "../training/planLinkParams";
import {
  doneParams,
  finishedRunParams,
  idleEnd,
  idleNote,
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
  session: 1,
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
    session: 1,
    minutes: 50,
    exerciseRestS: 120,
    items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }],
  };

  it("carries a run through its params and back", () => {
    expect(readWorkoutRun(runParams(run))).toEqual(run);
  });

  it("reads a workout with no exercises yet as a run, to add them as it goes", () => {
    expect(readWorkoutRun(runParams({ ...run, items: [] }))?.items).toEqual([]);
  });

  it("reads no run without items or a workout", () => {
    expect(readWorkoutRun({ ...runParams(run), items: "" })).toBeNull();
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

describe("a finished run's review", () => {
  const filing = {
    kind: "strength" as const,
    title: "5x5 strength",
    workoutId: "w1",
    link: { membershipId: null, week: null, focus: null },
    session: 1,
  };
  const startedAt = new Date(2026, 10, 16, 17, 55).getTime();
  const lastTickAt = startedAt + 47 * 60_000;

  it("reviews the session the run played, not the workout's first", () => {
    expect(readSession(finishedRunParams(filing, [], startedAt, lastTickAt))).toBe(1);
  });

  it("ends the duration at the last tick when the run sat idle over 20 minutes after it", () => {
    const params = finishedRunParams(
      filing,
      [],
      startedAt,
      lastTickAt + 143 * 60_000,
      [],
      lastTickAt
    );
    expect(params).toMatchObject({
      minutes: "47",
      startTime: "17:55",
      endTime: "18:42",
      idle: "143",
    });
    const end = idleEnd(params);
    expect(idleNote(end, 47)).toBe("Ended at your last set, 6:42 PM · left open 2h 23m after");
    expect(idleNote(end, 50)).toBeNull();
  });

  it("keeps the clock when the last tick was 20 minutes ago or less, or there was none", () => {
    const soon = finishedRunParams(filing, [], startedAt, lastTickAt + 20 * 60_000, [], lastTickAt);
    expect(soon.minutes).toBe("67");
    expect(idleEnd(soon)).toBeNull();
    const none = finishedRunParams(filing, [], startedAt, lastTickAt + 143 * 60_000);
    expect(none.minutes).toBe("190");
    expect(idleEnd(none)).toBeNull();
    expect(idleNote(null, 190)).toBeNull();
  });
});
