import { describe, expect, it } from "vitest";
import type { ItemDone } from "@sendtally/core/hang";
import { exerciseSeries } from "../statistics/exercises";
import {
  exerciseResults,
  gripSessions,
  hangGrid,
  hangTotals,
  pastSessions,
  seriesPoint,
  setChange,
  setEffort,
  setEffortText,
} from "./summary";

type Log = { id: string; date: string; startTime: string | null; workoutId: string | null };

const log = (id: string, date: string, done: ItemDone[], workoutId: string | null = "w1") => ({
  id,
  date,
  startTime: null,
  workoutId,
  done,
});

const squat = (...sets: [number, number][]): ItemDone => ({
  item: 0,
  exercise: "Back squat",
  sets: sets.map(([reps, weightKg]) => ({ reps, weightKg })),
});

describe("setChange", () => {
  it("compares the metric, then reps when the metric held", () => {
    expect(setChange({ reps: 5, weightKg: 85 }, { reps: 5, weightKg: 82.5 }, "load")).toEqual({
      metric: "load",
      by: 2.5,
    });
    expect(setChange({ reps: 7, weightKg: 10 }, { reps: 6, weightKg: 10 }, "load")).toEqual({
      metric: "reps",
      by: 1,
    });
    expect(setChange({ reps: 8 }, { reps: 8 }, "reps")).toEqual({ metric: "reps", by: 0 });
  });
});

describe("setEffort", () => {
  it("averages the rated sets to one decimal against the target, none when none was rated", () => {
    expect(setEffort([{ rpe: 8 }, { rpe: 9 }, { rpe: 9 }, {}], 8)).toEqual({
      actual: 8.7,
      target: 8,
    });
    expect(setEffort([{ rpe: 7 }])).toEqual({ actual: 7, target: null });
    expect(setEffort([{ reps: 5 }], 8)).toBeNull();
    expect(setEffortText({ actual: 8.8, target: 8 })).toEqual(["RPE 8.8", "· aimed 8"]);
    expect(setEffortText({ actual: 7, target: null })).toEqual(["RPE 7", ""]);
  });
});

describe("exerciseResults", () => {
  const before = log("a1", "2026-10-23", [squat([5, 80], [5, 80])]);
  const other = log("x", "2026-10-25", [squat([5, 120])], "w2");
  const today = log("a2", "2026-10-28", [
    squat([5, 82.5], [5, 82.5], [4, 82.5]),
    { item: 1, exercise: "Bench press", sets: [{ reps: 8, weightKg: 60 }] },
    { item: 2, exercise: "Cat-cow", sets: [] },
  ]);

  it("marks the best set and compares it with the same workout's previous session", () => {
    const [squats, bench] = exerciseResults(today, [today, other, before]);
    expect(squats).toEqual({
      exercise: "Back squat",
      sets: today.done[0]?.sets,
      best: 0,
      last: { set: { reps: 5, weightKg: 80 }, date: "2026-10-23" },
      change: { metric: "load", by: 2.5 },
      effort: null,
    });
    expect(bench).toMatchObject({ best: 0, last: null, change: null });
  });

  it("compares a log with no workout against any earlier session of the exercise", () => {
    const loose = { ...today, workoutId: null };
    const [squats] = exerciseResults(loose, [loose, other, before]);
    expect(squats?.last).toEqual({ set: { reps: 5, weightKg: 120 }, date: "2026-10-25" });
  });

  it("never compares with a later session", () => {
    expect(exerciseResults(before, [before, today])[0]).toMatchObject({ last: null });
  });

  it("has no best set for a checklist's ticks", () => {
    const flow = log("m", "2026-10-28", [{ item: 0, exercise: "Pigeon", sets: [{}] }], null);
    expect(exerciseResults(flow, [flow])[0]).toMatchObject({ best: null, change: null });
  });
});

describe("pastSessions", () => {
  const logs: Log[] = [
    { id: "a", date: "2026-10-21", startTime: null, workoutId: "w1" },
    { id: "b", date: "2026-10-28", startTime: "18:00", workoutId: "w1" },
    { id: "c", date: "2026-10-28", startTime: null, workoutId: "w2" },
    { id: "d", date: "2026-10-28", startTime: "07:00", workoutId: "w1" },
  ];

  it("lists the workout's sessions newest first, this one included", () => {
    expect(pastSessions(logs[0] as Log, logs).map((l) => l.id)).toEqual(["b", "d", "a"]);
  });

  it("has none for a log with no workout behind it", () => {
    expect(pastSessions({ ...(logs[0] as Log), workoutId: null }, logs)).toEqual([]);
  });
});

describe("seriesPoint", () => {
  const [series] = exerciseSeries([
    log("a", "2026-10-14", [squat([5, 75])]),
    log("b", "2026-10-21", [squat([5, 80])]),
    log("c", "2026-10-28", [squat([5, 77.5])]),
  ]);

  it("places a session in its exercise's series with its change and whether it is a best", () => {
    if (series === undefined) throw new Error("no series");
    expect(seriesPoint(series, "b")).toEqual({
      index: 1,
      change: { metric: "load", by: 5 },
      bestYet: true,
    });
    expect(seriesPoint(series, "c")).toMatchObject({ index: 2, bestYet: false });
    expect(seriesPoint(series, "a")).toEqual({ index: 0, change: null, bestYet: false });
    expect(seriesPoint(series, "zzz")).toBeNull();
  });
});

describe("hang sessions", () => {
  const protocol = {
    name: "Repeaters",
    kind: "hang" as const,
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 3,
    setRestS: 180,
  };
  const hang = (id: string, date: string, gripId: string, loadKg: number, workoutId = "r") => ({
    id,
    date,
    workoutId,
    gripId,
    loadKg,
    protocol,
  });

  it("fills the hangs held from the first set, the rest let go", () => {
    const grid = hangGrid({ protocol, pct: 94, loadKg: 0 });
    expect(grid.held).toBe(17);
    expect(grid.total).toBe(18);
    expect(grid.rows[2]).toEqual([true, true, true, true, true, false]);
    expect(grid.rows[0]?.every(Boolean)).toBe(true);
    expect(grid.loads).toEqual([0, 0, 0]);
  });

  it("reads each set's hangs and load as saved, hangs filling from the left", () => {
    const done = [{ item: 0, exercise: "half", sets: [{ reps: 6 }, { reps: 4, weightKg: 5 }] }];
    const grid = hangGrid({ protocol, pct: 0, loadKg: 2, done });
    expect(grid.rows[1]).toEqual([true, true, true, true, false, false]);
    expect(grid.loads).toEqual([2, 5]);
    expect(grid.held).toBe(10);
    expect(grid.total).toBe(12);
  });

  it("counts the hangs of every grip a session ran", () => {
    const sets = (...reps: number[]) => reps.map((r) => ({ reps: r, onS: 7, weightKg: 0 }));
    const done = [
      { item: 0, exercise: "half", sets: sets(6, 6, 6) },
      { item: 1, exercise: "open", sets: sets(6, 4, 6) },
      { item: 2, exercise: "pinch", sets: sets(6, 6) },
    ];
    expect(hangTotals({ gripId: "half", protocol, pct: 0, loadKg: 0, done })).toMatchObject({
      held: 46,
      total: 48,
    });
  });

  it("counts one grip as its grid does", () => {
    const done = [{ item: 0, exercise: "half", sets: [{ reps: 6 }, { reps: 4, weightKg: 5 }] }];
    const one = { gripId: "half", protocol, pct: 0, loadKg: 2, done };
    expect(hangTotals(one)).toEqual({ held: 10, total: 12, loads: [2, 5] });
  });

  it("finds every session on the grip", () => {
    const all = [
      hang("1", "2026-10-20", "half", 10),
      hang("2", "2026-10-22", "open", 4),
      hang("3", "2026-10-23", "half", 8, "other"),
      hang("4", "2026-10-27", "half", 12),
    ];
    const today = all[3];
    if (today === undefined) throw new Error("no session");
    expect(gripSessions(today, all).map((s) => s.id)).toEqual(["1", "3", "4"]);
  });
});
