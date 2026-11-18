import { describe, expect, it } from "vitest";
import { DAY_MS } from "../trends/buckets";
import type { Done } from "./insights";
import { loadPlot, loadVM } from "./loadView";

const now = new Date(2026, 10, 16, 20);
const today = Date.UTC(2026, 10, 16);
const rec = (days: number, rpe: number | null = 6, minutes = 60, name = `r${days}`): Done => ({
  ref: { type: "activity", id: name, name },
  kind: "strength",
  focus: null,
  at: today - days * DAY_MS + 18 * 3_600_000,
  rpe,
  minutes,
  fingers: 0,
});
const weekly = (from: number, to: number, rpe = 6): Done[] =>
  Array.from({ length: to - from }, (_, i) => i + from)
    .filter((i) => i % 7 < 3)
    .map((i) => rec(i, rpe));

const daily = (from: number, to: number): Done[] =>
  Array.from({ length: to - from }, (_, i) => rec(i + from));

describe("loadVM", () => {
  it("gives an average week per bucket and over the range, level with the one before", () => {
    const vm = loadVM(weekly(0, 200), "3m", now);
    expect(vm).toMatchObject({
      state: "load",
      caption: "Per week",
      headline: "1,080",
      unit: "average week",
      sentence: "Level with the 3 months before.",
      ticks: ["Aug 17", "Sep 28", "Nov 9"],
      note: "Dashed: your average week. Load is effort (RPE) × minutes.",
      leftOutLine: null,
    });
    expect(vm.bars.map((b) => b.value)).toEqual(Array(13).fill(1080));
  });

  it("says how far up or down on the window before", () => {
    expect(loadVM([...weekly(0, 91), ...weekly(91, 200, 3)], "3m", now).sentence).toBe(
      "Up 100% on the 3 months before."
    );
    expect(loadVM([...weekly(0, 28, 3), ...weekly(28, 70)], "1m", now).sentence).toBe(
      "Down 50% on the 4 weeks before."
    );
  });

  it("says nothing when the window before had no load, rather than a share of zero", () => {
    const vm = loadVM([...weekly(0, 91), rec(400)], "3m", now);
    expect(vm.state).toBe("load");
    expect(vm.sentence).toBeNull();
  });

  it("starts the average at the first counted week, stubbing the empty weeks before", () => {
    const vm = loadVM([rec(0), rec(2), rec(9)], "3m", now);
    expect(vm.sentence).toBe("Your first 2 weeks. The average starts at your first counted week.");
    expect(vm.bars.slice(0, 11).every((b) => b.value === 0)).toBe(true);
    expect(vm.bars.slice(11).map((b) => b.value)).toEqual([360, 720]);
    expect(vm.headline).toBe("540");
  });

  it("is one bar a day on 7D with the average day", () => {
    const vm = loadVM([rec(0), rec(2, 5, 60), rec(30)], "7d", now);
    expect(vm.bars.map((b) => b.value)).toEqual([0, 0, 0, 0, 300, 0, 360]);
    expect(vm).toMatchObject({
      caption: "Per day",
      headline: "94",
      unit: "average day",
      sentence: "660 in the last 7 days.",
      ticks: ["Tue", "Mon"],
      note: "Dashed: your average day. Load is effort (RPE) × minutes.",
    });
  });

  it("runs All from the first record with load, in years past 24 months", () => {
    const years = Array.from({ length: 15 }, (_, i) => ({
      ...rec(0, 6, i === 7 ? 120 : 60, `y${i}`),
      at: Date.UTC(2012 + i, 5, 1),
    }));
    const vm = loadVM(
      [{ ...rec(0, null, 0, "old"), at: Date.UTC(2008, 0, 1) }, ...years],
      "all",
      now
    );
    expect(vm.caption).toBe("Average week by year");
    expect(vm.bars).toHaveLength(15);
    expect(vm.ticks).toEqual(["2012", "2019", "2026"]);
    expect(vm.sentence).toBe(
      "Since 2012, your first year with effort and time. Biggest year: 2019."
    );
    expect(vm.leftOutLine?.replace(/\u00a0/g, " ")).toBe(
      "1 not counted in this range: no effort or time"
    );
  });

  it("runs All by month while it spans 24 months or fewer", () => {
    const vm = loadVM(weekly(0, 140), "all", now);
    expect(vm.caption).toBe("Average week by month");
    expect(vm.sentence).toBe("Since Jul, your first month with effort and time.");
  });

  it("has no load yet when nothing in the range has effort and time", () => {
    const vm = loadVM([rec(1, null), rec(3, 6, 0)], "3m", now);
    expect(vm).toMatchObject({
      state: "none",
      headline: "No load yet",
      unit: "",
      note: null,
    });
    expect(vm.leftOutLine?.replace(/\u00a0/g, " ")).toBe(
      "2 not counted in this range: no effort or time"
    );
    expect(vm.leftOut.map((l) => l.missing)).toEqual(["effort", "time"]);
    expect(vm.bars.every((b) => b.value === 0)).toBe(true);
  });

  it("marks a bucket with over a quarter left out and reads it on touch", () => {
    const vm = loadVM(
      [...weekly(0, 91), rec(1, null, 60, "n1"), rec(3, null, 60, "n2")],
      "3m",
      now
    );
    const last = vm.bars.at(-1)!;
    expect(last.under).toBe(true);
    expect(last.readout).toBe("Week of Nov 9 · 5 sessions · 2 not counted");
    expect(vm.bars[0]!.readout).toBe("Week of Aug 17 · 3 sessions");
    expect(vm.note).toBe(
      "Dashed: your average week. Load is effort (RPE) × minutes. A dot under a bar: over a quarter of it not counted."
    );
  });
});

describe("loadVM edges", () => {
  it("starts a month bar and the headline at the first counted day, not the month's first", () => {
    const first = Date.UTC(2026, 6, 20, 18);
    const daily = Array.from({ length: (today - Date.UTC(2026, 6, 20)) / DAY_MS + 1 }, (_, i) => ({
      ...rec(0, 1, 60, `d${i}`),
      at: first + i * DAY_MS,
    }));
    const vm = loadVM(daily, "all", now);
    expect(vm.caption).toBe("Average week by month");
    expect(vm.bars.map((b) => Math.round(b.value))).toEqual([420, 420, 420, 420, 420]);
    expect(vm.headline).toBe("420");
  });

  it("reads a month bar whose first counted day is its last as the last 7 days", () => {
    const vm = loadVM([{ ...rec(0, 6, 60, "j30"), at: Date.UTC(2026, 5, 30, 18) }], "all", now);
    expect(vm.bars[0]!.value).toBe(360);
    expect(vm.bars.every((b) => b.value <= 360)).toBe(true);
  });

  it("reads the bar as the last 7 days and the headline as a week for a history two days old", () => {
    const vm = loadVM([rec(0), rec(1)], "all", now);
    expect(vm.bars.map((b) => b.value)).toEqual([720]);
    expect(vm.headline).toBe("720");
    expect(loadVM([rec(0), rec(1)], "7d", now).headline).toBe("360");
  });

  it("reads a month only two days in as the last 7 days, so an even history stays even", () => {
    const dec2 = new Date(2026, 11, 2, 20);
    const even = Array.from({ length: 185 }, (_, i) => ({
      ...rec(0, 6, 60, `e${i}`),
      at: Date.UTC(2026, 11, 2, 18) - i * DAY_MS,
    }));
    const vm = loadVM(even, "6m", dec2);
    expect(vm.bars.map((b) => Math.round(b.value))).toEqual([2520, 2520, 2520, 2520, 2520, 2520]);
    expect(vm.bars.at(-1)!.readout).toBe("December 2026 · 2 sessions");
  });

  it("leaves future records out of the bars, the headline and the counts", () => {
    const future = [rec(-3, 9, 600, "f1"), rec(-40, null, 60, "f2")];
    for (const range of ["7d", "3m", "all"] as const) {
      const vm = loadVM([...weekly(0, 91), ...future], range, now);
      const without = loadVM(weekly(0, 91), range, now);
      expect(vm.headline).toBe(without.headline);
      expect(vm.bars.map((b) => b.readout)).toEqual(without.bars.map((b) => b.readout));
      expect(vm.leftOutLine).toBe(without.leftOutLine);
    }
  });

  it("cuts the window before at its first counted day, and says nothing under a week of it", () => {
    expect(loadVM(daily(0, 141), "3m", now).sentence).toBe("Level with the 3 months before.");
    expect(loadVM([...weekly(0, 91), rec(93)], "3m", now).sentence).toBeNull();
  });

  it("says in the spoken label that a bar with the dot is undercounted", () => {
    const vm = loadVM(
      [...weekly(0, 91), rec(1, null, 60, "n1"), rec(3, null, 60, "n2")],
      "3m",
      now
    );
    expect(vm.bars.at(-1)!.spoken).toBe(
      "Week of Nov 9: 1,080 · 5 sessions · 2 not counted · over a quarter not counted"
    );
    expect(vm.bars[0]!.spoken).not.toContain("quarter");
  });
});

describe("loadPlot", () => {
  it("lays bars 4px apart left of a 52px gutter, empty ones as 3px stubs", () => {
    const p = loadPlot(loadVM([rec(0), rec(2), rec(9)], "3m", now), 330);
    expect(p.right).toBe(278);
    expect(p.bars[0]).toMatchObject({ x: 2, y: 109, h: 3, path: null });
    expect(p.bars[0]!.w).toBeCloseTo(17.38, 2);
    expect(p.bars[12]).toMatchObject({ y: 12, h: 100 });
    expect(p.bars[12]!.x + p.bars[12]!.w).toBeCloseTo(276);
    expect(p.averageY).toBeCloseTo(112 - 75);
  });
});
