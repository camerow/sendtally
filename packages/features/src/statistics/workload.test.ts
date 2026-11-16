import { describe, expect, it } from "vitest";
import { DAY_MS } from "../trends/buckets";
import { workloadOn, workloadZone, type Loadable } from "./workload";

const today = Date.UTC(2026, 10, 16);
const ago = (days: number, hour = 18): number => today - days * DAY_MS + hour * 3_600_000;
const hour = (days: number, rpe: number | null = 6, minutes = 60): Loadable => ({
  at: ago(days),
  rpe,
  minutes,
});
/** Three sessions a week, Monday Wednesday Friday-ish, for `weeks` weeks back from today. */
const steady = (weeks: number): Loadable[] =>
  Array.from({ length: weeks * 7 }, (_, i) => i)
    .filter((i) => i % 7 < 3)
    .map((i) => hour(i));

describe("workloadOn", () => {
  it("reads 1.0 for a steady month", () => {
    const w = workloadOn(steady(6), today);
    expect(w.acute).toBe(1080);
    expect(w.chronic).toBe(1080);
    expect(w.ratio).toBe(1);
  });

  it("reads 1.6 when this week doubles, the acute week being inside the chronic", () => {
    const w = workloadOn([...steady(6), hour(0), hour(1), hour(2)], today);
    expect(w.acute).toBe(2160);
    expect(w.chronic).toBe(1350);
    expect(w.ratio).toBeCloseTo(1.6);
  });

  it("shows no ratio in the first 28 days and counts down to it", () => {
    expect(workloadOn([hour(20)], today)).toMatchObject({ ratio: null, daysToGo: 7 });
    expect(workloadOn([hour(27)], today)).toMatchObject({ ratio: 0, daysToGo: 0 });
    expect(workloadOn([], today)).toMatchObject({ ratio: null, daysToGo: 28, acute: 0 });
  });

  it("shows no ratio on the first week back after three weeks off", () => {
    const back = [...steady(12).filter((d) => d.at < ago(28)), hour(0), hour(2)];
    const w = workloadOn(back, today);
    expect(w).toMatchObject({ ratio: null, daysToGo: 0, acute: 720 });
    expect(workloadOn([...back, hour(8)], today).ratio).toBeCloseTo(720 / (1080 / 4));
  });

  it("leaves out records with no RPE or no minutes and counts them", () => {
    const w = workloadOn([...steady(6), hour(1, null), hour(2, 7, 0)], today);
    expect(w.acute).toBe(1080);
    expect(w.leftOut).toBe(2);
    expect(workloadOn([hour(40, null), hour(0)], today).daysToGo).toBe(27);
  });

  it("puts the window edges on day boundaries", () => {
    const edge = [hour(30), { at: today - 6 * DAY_MS, rpe: 5, minutes: 10 }];
    const lastIn = { at: today + DAY_MS - 1, rpe: 5, minutes: 10 };
    const firstOut = { at: today - 6 * DAY_MS - 1, rpe: 5, minutes: 10 };
    const tomorrow = { at: today + DAY_MS, rpe: 5, minutes: 10 };
    expect(workloadOn([...edge, lastIn, firstOut, tomorrow], today).acute).toBe(100);
    const old = { at: today - 27 * DAY_MS, rpe: 1, minutes: 4 };
    const older = { at: today - 27 * DAY_MS - 1, rpe: 1, minutes: 400 };
    expect(workloadOn([hour(40, 1, 0), old, older], today).chronic).toBe(1);
  });
});

describe("workloadZone", () => {
  it.each([
    [0.79, "light"],
    [0.8, "sweet"],
    [1.3, "sweet"],
    [1.31, "caution"],
    [1.5, "caution"],
    [1.51, "high"],
  ] as const)("%s is %s", (ratio, zone) => expect(workloadZone(ratio)).toBe(zone));
});
