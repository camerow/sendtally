import { describe, expect, it } from "vitest";
import { DAY_MS } from "../trends/buckets";
import type { Done } from "./insights";
import { workloadPlot, workloadVM } from "./workloadView";

const now = new Date(Date.UTC(2026, 10, 16, 20) + new Date().getTimezoneOffset() * 60_000);
const today = Date.UTC(2026, 10, 16);
const rec = (days: number, rpe: number | null = 6, minutes = 60, name = `r${days}`): Done => ({
  ref: { type: "activity", id: name, name },
  kind: "strength",
  focus: null,
  at: today - days * DAY_MS + 18 * 3_600_000,
  rpe,
  minutes,
});
const steady = Array.from({ length: 42 }, (_, i) => i)
  .filter((i) => i % 7 < 3)
  .map((i) => rec(i));

describe("workloadVM", () => {
  it("states a ratio and its zone in words, with the division in the sheet", () => {
    const vm = workloadVM(steady, "7d", now);
    expect(vm).toMatchObject({ state: "ratio", ratio: "1.00", zone: "sweet", acute: "1,080" });
    expect(vm.sentence).toBe("In line with your last four weeks.");
    expect(vm.sheet.footer).toBe("1,080 ÷ 1,080 = 1.00 · Sweet spot");
    expect(vm.sheet.tiles.map((x) => x.note)).toEqual(["Nov 10 to Nov 16", "Oct 20 to Nov 16 ÷ 4"]);
    expect(vm.sheet.weeks.map((w) => w.load)).toEqual([1080, 1080, 1080, 1080]);
  });

  it("plots a point a day on 7D and 1M and a week beyond", () => {
    expect(workloadVM(steady, "7d", now).points).toHaveLength(7);
    expect(workloadVM(steady, "1m", now).points).toHaveLength(28);
    expect(workloadVM(steady, "3m", now).points).toHaveLength(13);
  });

  it("breaks the line where there is no ratio", () => {
    const points = workloadVM(steady, "1m", now).points;
    expect(points.slice(0, 13).every((p) => p === null)).toBe(true);
    expect(points.at(-1)).toBe(1);
  });

  it("withholds the zone and lists what was left out, newest first", () => {
    const vm = workloadVM([...steady, rec(1, null), rec(2, 7, 0, "climb")], "7d", now);
    expect(vm).toMatchObject({
      state: "partial",
      ratio: null,
      zone: null,
      headline: "3 of 5 counted",
    });
    expect(vm.leftOutLine).toBe("2 not counted in the last 7 days: no effort or time");
    expect(vm.sheet.footer).toBe("No zone: more than a quarter left out");
    expect(vm.sheet.tiles.map((x) => x.counted)).toEqual(["3 of 5 counted", "12 of 14 counted"]);
    expect(vm.sheet.leftOut.map((l) => [l.ref.id, l.detail])).toEqual([
      ["r1", "Nov 15 · no effort"],
      ["climb", "Nov 14 · no time"],
    ]);
  });

  it("counts the first days and has no average week yet", () => {
    const vm = workloadVM([rec(11)], "7d", now);
    expect(vm).toMatchObject({
      state: "early",
      headline: "Day 12 of 28",
      chronic: null,
      daysLogged: 12,
    });
  });
});

describe("workloadPlot", () => {
  it("breaks runs at gaps, clamps above 2.0 and marks today", () => {
    const plot = workloadPlot([1, null, 0.5, 3], 336, 132);
    expect(plot.runs.map((r) => r.length)).toEqual([1, 2]);
    expect(plot.y(3)).toBe(plot.y(2));
    expect(plot.over).toHaveLength(1);
    expect(plot.today).toEqual(plot.over[0]);
  });
});
