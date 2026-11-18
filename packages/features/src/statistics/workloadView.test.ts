import { describe, expect, it } from "vitest";
import { DAY_MS } from "../trends/buckets";
import type { SessionWithClimbs } from "@sendtally/api-client";
import { doneOf, type Done } from "./insights";
import { workloadPlot, workloadVM, workloadWeeksOf } from "./workloadView";

const now = new Date(Date.UTC(2026, 10, 16, 20) + new Date().getTimezoneOffset() * 60_000);
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
const steady = Array.from({ length: 42 }, (_, i) => i)
  .filter((i) => i % 7 < 3)
  .map((i) => rec(i));

describe("workloadVM", () => {
  it("states a ratio and its zone in words, with the division in the sheet", () => {
    const vm = workloadVM(steady, 4, now);
    expect(vm).toMatchObject({ state: "ratio", ratio: "1.00", zone: "sweet", acute: "1,080" });
    expect(vm.sentence).toBe("In line with your last four weeks.");
    expect(vm.sheet.footer).toBe("1,080 ÷ 1,080 = 1.00 · Sweet spot");
    expect(vm.sheet.tiles.map((x) => x.note)).toEqual(["Nov 10 to Nov 16", "Oct 20 to Nov 16 ÷ 4"]);
    expect(vm.sheet.weeks.map((w) => w.load)).toEqual([1080, 1080, 1080, 1080]);
    expect(vm.sheet.weeks.map((w) => w.height)).toEqual([1, 1, 1, 1]);
    expect(vm.sheet.averageAt).toBe(1);
  });

  it("scales the bars and the average line against the tallest of them", () => {
    const vm = workloadVM([...steady, rec(0), rec(1), rec(2)], 4, now);
    expect(vm.sheet.weeks.map((w) => w.height)).toEqual([0.5, 0.5, 0.5, 1]);
    expect(vm.sheet.averageAt).toBeCloseTo(1350 / 2160);
    expect(workloadVM([], 4, now).sheet).toMatchObject({ averageAt: 0 });
  });

  it("plots a point a day over the window, ending today", () => {
    const year = Array.from({ length: 700 }, (_, i) => i)
      .filter((i) => i % 7 < 3)
      .map((i) => rec(i));
    expect(workloadVM(year, 4, now)).toMatchObject({ from: "Oct 20" });
    expect(workloadVM(year, 4, now).points).toHaveLength(28);
    expect(workloadVM(year, 8, now).points).toHaveLength(56);
    expect(workloadVM(year, 12, now)).toMatchObject({ from: "Aug 25" });
    expect(workloadVM(year, 12, now).points).toHaveLength(84);
  });

  it("reads the stored window, 4 weeks when there is none or it is not offered", () => {
    expect(workloadWeeksOf("8")).toBe(8);
    expect(workloadWeeksOf("12")).toBe(12);
    expect(workloadWeeksOf(null)).toBe(4);
    expect(workloadWeeksOf("6")).toBe(4);
  });

  it("keeps a long history to the window, whatever came before it", () => {
    const cluster = (from: number, weeks: number): Done[] =>
      Array.from({ length: weeks * 7 }, (_, i) => from - i)
        .filter((d) => d % 7 < 3)
        .map((d) => rec(d));
    const unscored = Array.from({ length: 80 }, (_, i) => rec(i * 61 + 5, null, 0, `u${i}`));
    const history = [
      rec(Math.round((today - Date.UTC(2012, 0, 3)) / DAY_MS), null, 0, "first"),
      ...cluster(1300, 30),
      ...cluster(140, 20),
      ...unscored,
    ];
    for (const weeks of [4, 8, 12] as const) {
      const vm = workloadVM(history, weeks, now);
      expect(vm.points).toHaveLength(weeks * 7);
      expect(vm.from).not.toMatch(/20\d\d/);
      expect(vm.state).toBe("partial");
      expect(vm.points.filter((p) => p !== null).length).toBeGreaterThan(weeks * 4);
    }
  });

  it("plots only ratios the card would state, and words alone under four of them", () => {
    const sparse = [0, 10, 20, 30, 40, 50, 60, 70, 80].map((d) => rec(d));
    const vm = workloadVM(sparse, 12, now);
    expect(vm).toMatchObject({ state: "few", headline: "3 counted" });
    expect(vm.sentence).toBe("Too few sessions in the last four weeks to compare.");
    expect(vm.points).toEqual([]);
    const thinned = [...steady.filter((d) => d.at < today - 27 * DAY_MS), rec(0), rec(9)];
    const thin = workloadVM(thinned, 12, now);
    expect(thin.state).toBe("few");
    expect(thin.points).toEqual([]);
  });

  it("breaks the line where there is no ratio", () => {
    const points = workloadVM(steady, 4, now).points;
    expect(points.slice(0, 13).every((p) => p === null)).toBe(true);
    expect(points.at(-1)).toBe(1);
  });

  it("withholds the zone and lists what was left out, newest first", () => {
    const vm = workloadVM([...steady, rec(1, null), rec(2, 7, 0, "climb")], 4, now);
    expect(vm).toMatchObject({
      state: "partial",
      ratio: null,
      zone: null,
      headline: "3 of 5 counted",
    });
    expect(vm.leftOutLine).toBe(
      "2 not counted in the last 7 days: no\u00a0effort\u00a0or\u00a0time"
    );
    expect(vm.sheet.footer).toBe("No zone: more than a quarter left out");
    expect(vm.sheet.tiles.map((x) => x.counted)).toEqual(["3 of 5 counted", "12 of 14 counted"]);
    expect(vm.sheet.leftOut.map((l) => [l.ref.id, l.missing, l.detail])).toEqual([
      ["r1", "effort", "Nov 15 · no effort"],
      ["climb", "time", "Nov 14 · no time"],
    ]);
  });

  it("counts the first days and has no average week yet", () => {
    const vm = workloadVM([rec(11)], 4, now);
    expect(vm).toMatchObject({
      state: "early",
      headline: "Day 12 of 28",
      chronic: null,
      daysLogged: 12,
    });
  });
});

describe("workloadPlot", () => {
  const plot = workloadPlot([1, null, 0.5, 2, 0, 4, null, 1.2, null, 0.1], 336, 132);

  it("puts half and double the same distance from 1.0 on a log axis", () => {
    expect(plot.y(1) - plot.y(2)).toBeCloseTo(plot.y(0.5) - plot.y(1));
    expect(plot.y(2) - plot.y(4)).toBeCloseTo(plot.y(1) - plot.y(2));
  });

  it("spans 0.25 to 4.0 with nothing clipped and rest days in a lane below", () => {
    expect(plot.y(4)).toBe(10);
    expect(plot.y(0.1)).toBe(plot.y(0.25));
    expect(plot.restY).toBeGreaterThan(plot.y(0.25));
    for (const r of [0.3, 0.8, 1.3, 1.5, 3.9]) {
      expect(plot.y(r)).toBeGreaterThan(plot.y(4));
      expect(plot.y(r)).toBeLessThan(plot.y(0.25));
    }
  });

  it("draws the line in runs that break at gaps and rest days, a lone day as a dot", () => {
    expect(plot.runs.map((r) => r.length)).toEqual([2]);
    expect(plot.lone.map(([, y]) => y)).toEqual([1, 4, 1.2, 0.1].map(plot.y));
    expect(plot.today).toEqual([expect.any(Number), plot.y(0.1)]);
  });

  it("draws each run of rest days as one bar in the rest lane", () => {
    const rested = workloadPlot([1, 0, 0, 0, 1, 0, 1], 336, 132);
    expect(rested.rest).toHaveLength(2);
    const [long, lone] = rested.rest;
    expect(long?.[1]).toBeGreaterThan(long?.[0] ?? Infinity);
    expect(lone?.[0]).toBe(lone?.[1]);
  });

  it("puts today in the rest lane after a week with nothing logged", () => {
    expect(workloadPlot([1, 0], 336, 132).today?.[1]).toBe(plot.restY);
  });
});

describe("doneOf", () => {
  const climb = (times: SessionWithClimbs["times"]): SessionWithClimbs =>
    ({
      fingerprint: `manual-${times}`,
      name: "Tuesday night session",
      title: "Tuesday night session",
      start_at: "2026-11-15T18:00:00.000Z",
      end_at: "2026-11-15T19:30:00.000Z",
      times,
      rpe: 6,
      rpe_source: "user",
      focus: null,
    }) as SessionWithClimbs;
  const load = (times: SessionWithClimbs["times"]): Done | undefined =>
    doneOf({ sessions: [climb(times)], hangSessions: [], hangParts: [], activities: [] })[0];

  it("counts a form-logged climbing session by its duration", () => {
    expect(load("duration")).toMatchObject({ rpe: 6, minutes: 90 });
    const vm = workloadVM([...steady, load("duration")!], 4, now);
    expect(vm.sheet.leftOut).toEqual([]);
  });

  it("leaves out a climbing session with no times as missing its time", () => {
    expect(load("none")).toMatchObject({ minutes: 0 });
    const vm = workloadVM([...steady, load("none")!], 4, now);
    expect(vm.sheet.leftOut.map((l) => [l.ref.type, l.missing])).toEqual([["session", "time"]]);
  });
});
