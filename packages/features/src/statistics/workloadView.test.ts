import { describe, expect, it } from "vitest";
import { DAY_MS } from "../trends/buckets";
import type { SessionWithClimbs } from "@sendtally/api-client";
import { doneOf, type Done } from "./insights";
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
    expect(vm.sheet.weeks.map((w) => w.height)).toEqual([1, 1, 1, 1]);
    expect(vm.sheet.averageAt).toBe(1);
  });

  it("scales the bars and the average line against the tallest of them", () => {
    const vm = workloadVM([...steady, rec(0), rec(1), rec(2)], "7d", now);
    expect(vm.sheet.weeks.map((w) => w.height)).toEqual([0.5, 0.5, 0.5, 1]);
    expect(vm.sheet.averageAt).toBeCloseTo(1350 / 2160);
    expect(workloadVM([], "7d", now).sheet).toMatchObject({ averageAt: 0 });
  });

  it("plots a point a day on 7D and 1M and a week beyond", () => {
    const year = Array.from({ length: 700 }, (_, i) => i)
      .filter((i) => i % 7 < 3)
      .map((i) => rec(i));
    expect(workloadVM(year, "7d", now).points).toHaveLength(7);
    expect(workloadVM(year, "1m", now).points).toHaveLength(28);
    expect(workloadVM(year, "3m", now).points).toHaveLength(13);
    expect(workloadVM(year, "y2026", now)).toMatchObject({ from: "Jan 5" });
    expect(workloadVM(year, "y2026", now).points).toHaveLength(46);
    expect(workloadVM(year, "1y", now)).toMatchObject({ from: "Dec 1, 2025" });
    expect(workloadVM(year, "1y", now).points).toHaveLength(51);
  });

  it("plots only ratios the card would state, and words alone under four of them", () => {
    const sparse = [0, 10, 20, 30, 40, 50, 60, 70, 80].map((d) => rec(d));
    const vm = workloadVM(sparse, "3m", now);
    expect(vm).toMatchObject({ state: "few", headline: "3 counted" });
    expect(vm.sentence).toBe("Too few sessions in the last four weeks to compare.");
    expect(vm.points).toEqual([]);
    const thinned = [...steady.filter((d) => d.at < today - 27 * DAY_MS), rec(0), rec(9)];
    const thin = workloadVM(thinned, "3m", now);
    expect(thin.state).toBe("few");
    expect(thin.points).toEqual([]);
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
    expect(vm.sheet.leftOut.map((l) => [l.ref.id, l.missing, l.detail])).toEqual([
      ["r1", "effort", "Nov 15 · no effort"],
      ["climb", "time", "Nov 14 · no time"],
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
  const plot = workloadPlot([1, null, 0.5, 2, 0, 4, null, 1.2, null, 0.1], 336, 132);

  it("puts half and double the same distance from 1.0 on a log axis", () => {
    expect(plot.y(1) - plot.y(2)).toBeCloseTo(plot.y(0.5) - plot.y(1));
    expect(plot.y(2) - plot.y(4)).toBeCloseTo(plot.y(1) - plot.y(2));
  });

  it("spans 0.25 to 4.0 with nothing clipped and rest weeks in a lane below", () => {
    expect(plot.y(4)).toBe(10);
    expect(plot.y(0.1)).toBe(plot.y(0.25));
    expect(plot.restY).toBeGreaterThan(plot.y(0.25));
    expect(plot.rest).toEqual([[expect.any(Number), plot.restY]]);
    for (const r of [0.3, 0.8, 1.3, 1.5, 3.9]) {
      expect(plot.y(r)).toBeGreaterThan(plot.y(4));
      expect(plot.y(r)).toBeLessThan(plot.y(0.25));
    }
  });

  it("draws every point as a dot, joins runs, and breaks at gaps and rest weeks", () => {
    expect(plot.dots).toHaveLength(6);
    expect(plot.runs.map((r) => r.length)).toEqual([2]);
    expect(plot.today).toEqual(plot.dots.at(-1));
  });

  it("shrinks the dots until neighbours on a crowded phone plot no longer touch", () => {
    const year = Array.from({ length: 46 }, () => 1);
    expect(workloadPlot(year, 900, 132).dotRadius).toBe(3.2);
    const phone = workloadPlot(year, 300, 132);
    expect(phone.dotRadius * 2).toBeLessThan((phone.dots[1]?.[0] ?? 0) - (phone.dots[0]?.[0] ?? 0));
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
    doneOf({ sessions: [climb(times)], hangSessions: [], activities: [] })[0];

  it("counts a form-logged climbing session by its duration", () => {
    expect(load("duration")).toMatchObject({ rpe: 6, minutes: 90 });
    const vm = workloadVM([...steady, load("duration")!], "7d", now);
    expect(vm.sheet.leftOut).toEqual([]);
  });

  it("leaves out a climbing session with no times as missing its time", () => {
    expect(load("none")).toMatchObject({ minutes: 0 });
    const vm = workloadVM([...steady, load("none")!], "7d", now);
    expect(vm.sheet.leftOut.map((l) => [l.ref.type, l.missing])).toEqual([["session", "time"]]);
  });
});
