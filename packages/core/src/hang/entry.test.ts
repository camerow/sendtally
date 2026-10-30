import { describe, expect, it } from "vitest";
import {
  entryNumber,
  entrySeconds,
  numberEntry,
  openNumber,
  openTime,
  timeEntry,
  timeText,
  type EntryAction,
  type NumberLimits,
  type TimeLimits,
} from ".";

const action = (key: string): EntryAction => {
  if (/^\d+$/.test(key)) return { type: "digit", digit: key };
  return { type: key } as EntryAction;
};

const typeTime = (start: number, keys: string, limits?: TimeLimits): string =>
  timeText(
    keys.split(" ").reduce((s, k) => timeEntry(s, action(k), limits), openTime(start, limits))
  ).join("");

const typeNumber = (start: number, keys: string, limits: NumberLimits): string =>
  keys.split(" ").reduce((s, k) => numberEntry(s, action(k), limits), openNumber(start, limits))
    .text;

describe("timeEntry", () => {
  it.each([
    ["1", "00:00:01"],
    ["1 0", "00:00:10"],
    ["1 0 0", "00:01:00"],
    ["9 0", "00:00:90"],
    ["9 0 done", "00:01:30"],
    ["2 0 0 0", "00:20:00"],
    ["7 plus plus", "00:01:07"],
    ["1 0 minus", "00:00:00"],
    ["1 0 0 back", "00:00:10"],
    ["back", "00:00:00"],
    ["1 00", "00:01:00"],
    ["1 2 3 4 5 6", "12:34:56"],
    ["1 2 3 4 5 6 7", "12:34:56"],
    ["9 9 9 9 9 9 done", "23:59:59"],
    ["0 0", "00:00:00"],
  ])("types %j from 7 s as %s", (keys, expected) => {
    expect(typeTime(7, keys)).toBe(expected);
  });

  it("replaces the old value on the first digit, and back trims it", () => {
    expect(typeTime(1200, "5")).toBe("00:00:05");
    expect(typeTime(1200, "back")).toBe("00:02:00");
  });

  it("steps from the old value without replacing it", () => {
    expect(typeTime(60, "plus")).toBe("00:01:30");
  });

  it("clamps to the field's limits on done and on a step", () => {
    expect(typeTime(0, "5 0 0 done", { max: 240 })).toBe("00:04:00");
    expect(typeTime(0, "5 done", { min: 10 })).toBe("00:00:10");
    expect(typeTime(230, "plus", { max: 240 })).toBe("00:04:00");
  });

  it("opens on a value, clamped", () => {
    expect(entrySeconds(openTime(1200))).toBe(1200);
    expect(entrySeconds(openTime(-5))).toBe(0);
    expect(entrySeconds(timeEntry(openTime(0), action("9")))).toBe(9);
  });

  it("splits the dimmed leading zeros", () => {
    expect(timeText(openTime(7))).toEqual(["00:00:0", "7"]);
    expect(timeText(openTime(0))).toEqual(["00:00:0", "0"]);
    expect(timeText(openTime(1200))).toEqual(["00:", "20:00"]);
  });
});

describe("numberEntry", () => {
  const count: NumberLimits = { step: 1, min: 1 };
  const weight: NumberLimits = { step: 2.5, min: -200, decimals: true, signed: true };

  it.each([
    [count, 5, "1 2", "12"],
    [count, 5, "00", "0"],
    [count, 5, "4 00", "400"],
    [count, 5, "plus", "6"],
    [count, 1, "minus", "1"],
    [count, 5, "0 done", "1"],
    [count, 5, "decimal 5", "5"],
    [count, 5, "sign", "5"],
    [count, 12, "back", "1"],
    [count, 5, "back back", "0"],
    [{ step: 1, max: 10 }, 5, "5 0 done", "10"],
    [weight, 20, "7 decimal 5", "7.5"],
    [weight, 20, "decimal 5", "0.5"],
    [weight, 20, "7 decimal decimal 5", "7.5"],
    [weight, 20, "7 decimal 5 sign", "-7.5"],
    [weight, -7.5, "sign", "7.5"],
    [weight, 0, "sign 7", "-7"],
    [weight, 20, "minus", "17.5"],
    [weight, -7.5, "plus", "-5"],
    [weight, 20, "1 2 3 4 5 6 7 8 9", "12345678"],
    [weight, 0, "sign back", "0"],
  ] as const)("types from %j at %d: %j is %s", (limits, start, keys, expected) => {
    expect(typeNumber(start, keys, limits)).toBe(expected);
  });

  it("reads the typed value", () => {
    expect(entryNumber({ text: "-", fresh: false })).toBe(0);
    expect(entryNumber({ text: "7.", fresh: false })).toBe(7);
  });
});
