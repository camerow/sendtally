import { describe, expect, it } from "vitest";
import type { SetClimb, SetDone } from "@sendtally/core/hang";
import { climbingDoseLine, climbingLastTime, climbsLine, wallChip, wallLine } from "./climbing";
import { setChip, setText } from "./done";
import { exerciseResults, seriesPoint } from "./summary";
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

  it("reads time on the wall as time and laps, and names the circuits", () => {
    const sets: SetDone[] = [
      { onS: 1200, climbs: Array.from({ length: 18 }, () => green) },
      { onS: 1200, climbs: Array.from({ length: 16 }, () => green) },
    ];
    expect(wallChip(sets[0]!)).toBe("20:00 · 18 laps");
    expect(setChip(sets[1]!, "kg")).toBe("20:00 · 16 laps");
    expect(wallLine(sets)).toBe("40:00 on the wall · Green circuit");
    expect(climbingLastTime(sets, "wallTime")).toBe("Last time: 40:00 on the wall · Green circuit");
    expect(climbingLastTime([{ reps: 4 }], "climbs")).toBeNull();
  });

  it("states a climbing dose without grades", () => {
    expect(climbingDoseLine({ sets: 4, reps: 4 }, "climbs")).toBe("4 sets of 4 climbs");
    expect(climbingDoseLine({ sets: 1 }, "climbs")).toBe("1 set");
    expect(climbingDoseLine({ sets: 2, onS: 1200 }, "wallTime")).toBe("2 × 20:00 on the wall");
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
    expect(exerciseResults(second, [first, second])[0]?.change).toEqual({ metric: "sends", by: 2 });

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
    expect(laps[0]?.metric).toBe("laps");
  });
});
