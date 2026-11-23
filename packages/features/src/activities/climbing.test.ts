import { describe, expect, it } from "vitest";
import type { SetClimb, SetDone } from "@sendtally/core/hang";
import {
  climbingDoseLine,
  lapPlanFor,
  climbingLastTime,
  climbLine,
  climbsLine,
  wallChip,
  wallLine,
} from "./climbing";
import { setText } from "./done";
import { seriesPoint } from "./summary";
import { exerciseSeries } from "../statistics/exercises";

const v = (grade: string, sent = true, tries = 1): SetClimb => ({
  grade,
  scale: "v",
  tries,
  sent,
});

const green: SetClimb = {
  ...v("V1"),
  circuit: { id: "g", label: "Green", colour: "green" },
};

const fourSets = (grades: string[][]): SetDone[] =>
  grades.map((set) => ({
    climbs: set.map((g) => (g.endsWith("x") ? v(g.slice(0, -1), false, 2) : v(g))),
  }));

describe("climbing sets", () => {
  it("reads climbs as a count, sends and the hardest send", () => {
    const sets = fourSets([
      ["V4", "V3", "V4", "V3"],
      ["V3", "V4x", "V3", "V3"],
    ]);
    expect(climbsLine(sets)).toBe("8 climbs · 7 sent · top V4");
    expect(climbsLine([{ climbs: [v("V5", false)] }])).toBe("1 climb · 0 sent");
    expect(setText(sets[0]!, "kg")).toBe("4 climbs · 4 sent · top V4");
  });

  it("reads one climb as its attempts, and sent when it went", () => {
    expect(climbLine({ grade: "V5", scale: "v", tries: 3, sent: true })).toBe("3 attempts · sent");
    expect(climbLine({ grade: "V6", scale: "v", tries: 1, sent: false })).toBe("1 attempt");
  });

  it("reads time on the wall as time and laps, and names the circuits", () => {
    const sets: SetDone[] = [
      { onS: 1200, climbs: Array.from({ length: 18 }, () => green) },
      { onS: 1200, climbs: Array.from({ length: 16 }, () => green) },
    ];
    expect(wallChip(sets[0]!)).toBe("20:00 · 18 climbs");
    expect(wallLine(sets)).toBe("40:00 min · Green circuit");
    expect(climbingLastTime(sets, "wallTime")).toBe("Last time: 40:00 min · Green circuit");
    expect(climbingLastTime([{ reps: 4 }], "climbs")).toBeNull();
  });

  it("states a climbing dose without grades", () => {
    expect(climbingDoseLine({ sets: 4, reps: 4 }, "climbs")).toBe("4 sets of 4 climbs");
    expect(climbingDoseLine({ sets: 1 }, "climbs")).toBe("1 set");
    expect(climbingDoseLine({ sets: 2, onS: 1200 }, "wallTime")).toBe("2 × 20:00 min");
    expect(climbingDoseLine({ sets: 1, onS: 2700 }, "wallTime")).toBe("45:00 min");
    expect(climbingDoseLine({ sets: 3, setsMax: 4, reps: 4, repsMax: 6 }, "climbs")).toBe(
      "3-4 sets of 4-6 climbs"
    );
  });

  it("states circuit laps in moves or time, and counts the clean ones", () => {
    expect(climbingDoseLine({ sets: 3, reps: 40 }, "laps")).toBe("3 laps of 40 moves");
    expect(climbingDoseLine({ sets: 1, onS: 240 }, "laps")).toBe("1 lap of 4 min");
    const laps = [{ reps: 40 }, { reps: 28 }, { reps: 40 }];
    expect(climbingLastTime(laps, "laps", { sets: 3, reps: 40 })).toBe(
      "Last time: 3 laps · 2 clean"
    );
  });

  it("compares sends and laps with last time over the whole session", () => {
    const first = {
      id: "a1",
      date: "2026-10-01",
      startTime: null,
      workoutId: "w1",
      done: [
        {
          item: 0,
          exercise: "4x4s",
          sets: fourSets([
            ["V4", "V3x"],
            ["V3x", "V3"],
          ]),
        },
      ],
    };
    const second = {
      id: "a2",
      date: "2026-10-08",
      startTime: null,
      workoutId: "w1",
      done: [
        {
          item: 0,
          exercise: "4x4s",
          sets: fourSets([
            ["V4", "V3"],
            ["V4", "V3"],
          ]),
        },
      ],
    };

    const [series] = exerciseSeries([first, second]);
    expect(series?.metric).toBe("sends");
    expect(series?.sessions.map((s) => s.value)).toEqual([2, 4]);
    expect(seriesPoint(series!, "a2")).toEqual({
      index: 1,
      change: { metric: "sends", by: 2 },
      bestYet: true,
    });

    const laps = exerciseSeries([
      { ...first, done: [{ item: 0, exercise: "ARC", sets: [{ onS: 1200, climbs: [green] }] }] },
    ]);
    expect(laps[0]?.metric).toBe("climbs");
  });

  it("measures a logged circuit against its dose, else its own laps", () => {
    expect(lapPlanFor({ sets: 3, reps: 40 }, [{ reps: 8 }])).toEqual({ unit: "moves", target: 40 });
    expect(lapPlanFor(undefined, [{ reps: 30 }, { reps: 12 }])).toEqual({
      unit: "moves",
      target: 30,
    });
    expect(lapPlanFor(undefined, [{ onS: 270 }])).toEqual({ unit: "seconds", target: 270 });
  });
});
