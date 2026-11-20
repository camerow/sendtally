import { describe, expect, it } from "vitest";
import type { ItemDone } from "@sendtally/core/hang";
import { exerciseSeries } from "../statistics/exercises";
import { hangGrids, hangTotals, pastSessions, seriesPoint, setChange } from "./summary";

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

  it("reads each set's hangs and load as saved, hangs filling from the left", () => {
    const done = [{ item: 0, exercise: "half", sets: [{ reps: 6 }, { reps: 4, weightKg: 5 }] }];
    expect(
      hangGrids({ gripId: "half", edgeMm: 20, protocol, pct: 0, loadKg: 2, done })
    ).toMatchObject([
      {
        rows: [Array(6).fill(true), [true, true, true, true, false, false]],
        loads: [2, 5],
        held: 10,
        total: 12,
      },
    ]);
  });

  it("counts the hangs of every grip a session ran", () => {
    const sets = (...reps: number[]) => reps.map((r) => ({ reps: r, onS: 7, weightKg: 0 }));
    const done = [
      { item: 0, exercise: "half", sets: sets(6, 6, 6) },
      { item: 1, exercise: "open", sets: sets(6, 4, 6) },
      { item: 2, exercise: "pinch", sets: sets(6, 6) },
    ];
    expect(
      hangTotals({ gripId: "half", edgeMm: 20, protocol, pct: 0, loadKg: 0, done })
    ).toMatchObject({
      held: 46,
      total: 48,
    });
  });

  it("counts one grip as its grid does", () => {
    const done = [{ item: 0, exercise: "half", sets: [{ reps: 6 }, { reps: 4, weightKg: 5 }] }];
    const one = { gripId: "half", edgeMm: 20, protocol, pct: 0, loadKg: 2, done };
    expect(hangTotals(one)).toEqual({ held: 10, total: 12, loads: [2, 5] });
  });

  it("draws a card for every grip a session ran, in the order it ran", () => {
    const sets = (edgeMm: number, weightKg: number, ...reps: number[]) =>
      reps.map((r) => ({ reps: r, onS: 7, edgeMm, weightKg }));
    const done = [
      { item: 0, exercise: "half", sets: sets(20, 5, 6, 6, 6) },
      { item: 1, exercise: "open", sets: sets(15, 0, 6, 4, 6) },
      { item: 2, exercise: "pinch", sets: [{ reps: 5, weightKg: 10, rpe: 8 }] },
    ];
    const cards = hangGrids({ gripId: "half", edgeMm: 20, protocol, pct: 0, loadKg: 5, done });
    expect(
      cards.map(({ gripId, kind, edgeMm, held, total, loads, rpes }) => ({
        gripId,
        kind,
        edgeMm,
        held,
        total,
        loads,
        rpes,
      }))
    ).toEqual([
      {
        gripId: "half",
        kind: "hang",
        edgeMm: 20,
        held: 18,
        total: 18,
        loads: [5, 5, 5],
        rpes: [undefined, undefined, undefined],
      },
      {
        gripId: "open",
        kind: "hang",
        edgeMm: 15,
        held: 16,
        total: 18,
        loads: [0, 0, 0],
        rpes: [undefined, undefined, undefined],
      },
      { gripId: "pinch", kind: "pull", edgeMm: 0, held: 5, total: 5, loads: [10], rpes: [8] },
    ]);
    expect(cards[1]?.rows[1]).toEqual([true, true, true, true, false, false]);
  });

  it("carries each set's seconds on, so a set of one hang reads its time held", () => {
    const max = { ...protocol, name: "Max hangs", hangS: 10, restS: 0, reps: 1, sets: 2 };
    const done = [
      {
        item: 0,
        exercise: "half",
        sets: [
          { reps: 1, onS: 7 },
          { reps: 0, onS: 10 },
        ],
      },
    ];
    const [card] = hangGrids({
      gripId: "half",
      edgeMm: 20,
      protocol: max,
      pct: 0,
      loadKg: 0,
      done,
    });
    expect(card?.rows).toEqual([[true], [false]]);
    expect(card?.seconds).toEqual([7, 10]);
  });

  it("draws a one-grip session's card from its share held", () => {
    const one = { gripId: "half", edgeMm: 20, protocol, pct: 94, loadKg: 0 };
    const held = Array(6).fill(true);
    expect(hangGrids(one)).toEqual([
      {
        gripId: "half",
        kind: "hang",
        edgeMm: 20,
        rows: [held, held, [true, true, true, true, true, false]],
        loads: [0, 0, 0],
        rpes: [undefined, undefined, undefined],
        seconds: [undefined, undefined, undefined],
        held: 17,
        total: 18,
      },
    ]);
  });
});
