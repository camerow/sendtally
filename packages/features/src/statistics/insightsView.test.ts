import { describe, expect, it } from "vitest";
import { exerciseByKey } from "./exercises";
import type { ExerciseTrendVM, TrainedFocusVM, TrainedKindVM } from "./insights";
import { insightsLine, mixRows, sparkPoints, trendChange } from "./insightsView";

const trained: TrainedKindVM[] = [{ kind: "hangboard", name: "Fingers", share: 3, detail: "3" }];
const byFocus: TrainedFocusVM[] = [
  { focus: "power", name: "Power", share: 2, detail: "2" },
  { focus: null, name: "General", share: 1, detail: "1" },
];

const trend = (over: Partial<ExerciseTrendVM>): ExerciseTrendVM =>
  ({
    key: "k",
    name: "Squat",
    count: 3,
    values: [],
    change: 5,
    metric: "load",
    ...over,
  }) as ExerciseTrendVM;

describe("insights view", () => {
  it("keys the mix by kind or by focus", () => {
    expect(mixRows({ trained, byFocus }, "category").map((r) => r.key)).toEqual(["hangboard"]);
    const focus = mixRows({ trained, byFocus }, "focus");
    expect(focus.map((r) => r.key)).toEqual(["power", "general"]);
    expect(focus.every((r) => r.color.length > 0)).toBe(true);
  });

  it("says how far an exercise moved, nothing when it did not", () => {
    expect(trendChange(trend({}), "kg")).toBe("+5 kg");
    expect(trendChange(trend({ change: -5 }), "kg")).toBe("−5 kg");
    expect(trendChange(trend({ change: 0 }), "kg")).toBe("");
    expect(trendChange(trend({ count: 1 }), "kg")).toBe("");
  });

  it("draws the last six values, a flat run across the middle", () => {
    expect(sparkPoints([9, 1, 2, 3, 4, 5, 6])).toHaveLength(6);
    expect(sparkPoints([4, 4]).map(([, y]) => y)).toEqual([10, 10]);
  });

  it("scales effort out of ten and sessions to the busiest, skipping no effort", () => {
    const points = [
      { label: "a", axis: "a", sessions: 2, effort: 5 },
      { label: "b", axis: "b", sessions: 4, effort: null },
    ];
    expect(insightsLine(points, "effort", 100, 100, 0)).toEqual([[0, 50]]);
    expect(insightsLine(points, "sessions", 100, 100, 0)).toEqual([
      [0, 50],
      [100, 0],
    ]);
  });

  it("finds an exercise by its key", () => {
    expect(exerciseByKey([{ name: " Back Squat " }], "back squat")).toEqual({
      name: " Back Squat ",
    });
    expect(exerciseByKey([{ name: "Dips" }], "squat")).toBeUndefined();
  });
});
