import { describe, expect, it } from "vitest";
import {
  entryNumber,
  entrySeconds,
  entryRange,
  numberEntry,
  openNumber,
  openRange,
  rangeEntry,
  typedRange,
  typedNumber,
  typedSeconds,
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
    const hour = { max: 3599 };
    expect(timeText(openTime(90, hour), hour)).toEqual(["0", "1:30"]);
    expect(timeText(openTime(45, hour), hour)).toEqual(["00:", "45"]);
    expect(
      timeEntry(
        timeEntry(openTime(0, hour), { type: "digit", digit: "1234" }, hour),
        { type: "digit", digit: "5" },
        hour
      ).digits
    ).toBe("1234");
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

describe("typed text", () => {
  it.each([
    ["1:30", 90],
    ["130", 90],
    ["90", 90],
    ["0:10", 10],
    ["1:00:00", 3600],
    [" 3:00 ", 180],
  ])("reads the time %j as %d seconds", (text, seconds) => {
    expect(typedSeconds(text)).toBe(seconds);
  });

  it("clamps a typed time and reads nothing typed as null", () => {
    expect(typedSeconds("5", { min: 10 })).toBe(10);
    expect(typedSeconds("")).toBeNull();
    expect(typedSeconds("abc")).toBeNull();
  });

  it.each([
    ["12", { step: 1 }, 12],
    ["7,5", { step: 2.5, decimals: true }, 7.5],
    ["7.5", { step: 1 }, 8],
    ["-3", { step: 1 }, 3],
    ["-3", { step: 1, signed: true }, -3],
    ["50", { step: 1, max: 10 }, 10],
  ] as const)("reads the number %j under %j as %d", (text, limits, value) => {
    expect(typedNumber(text, limits)).toBe(value);
  });

  it("reads a number that is not one as null", () => {
    expect(typedNumber("", { step: 1 })).toBeNull();
    expect(typedNumber("x", { step: 1 })).toBeNull();
  });
});

const counts: NumberLimits = { step: 1, min: 1, max: 100 };

const typeRange = (start: { min: number; max?: number }, keys: string): string =>
  keys.split(" ").reduce((s, k) => rangeEntry(s, action(k), counts), openRange(start, counts)).text;

describe("rangeEntry", () => {
  it("types one number until To, then the top after a hyphen", () => {
    expect(typeRange({ min: 3 }, "4")).toBe("4");
    expect(typeRange({ min: 3 }, "to 5")).toBe("3-5");
    expect(typeRange({ min: 3 }, "8 to 1 2")).toBe("8-12");
    expect(typeRange({ min: 3 }, "8 to to")).toBe("8-");
  });

  it("replaces a range opened on with the first digit, and steps the end being typed", () => {
    expect(typeRange({ min: 3, max: 5 }, "4")).toBe("4");
    expect(typeRange({ min: 3, max: 5 }, "plus")).toBe("3-6");
    expect(typeRange({ min: 3 }, "plus")).toBe("4");
    expect(typeRange({ min: 3 }, "to minus")).toBe("3-1");
  });

  it("deletes back past the hyphen to one number", () => {
    expect(typeRange({ min: 3 }, "8 to 1 2 back")).toBe("8-1");
    expect(typeRange({ min: 3 }, "8 to 1 2 back back back")).toBe("8");
  });

  it("reads its ends in order, and a top at the bottom or none as one number", () => {
    const read = (text: string) => entryRange({ text, fresh: false }, counts);
    expect(read("8-12")).toEqual({ min: 8, max: 12 });
    expect(read("5-3")).toEqual({ min: 3, max: 5 });
    expect(read("4-4")).toEqual({ min: 4 });
    expect(read("4-")).toEqual({ min: 4 });
    expect(read("0-200")).toEqual({ min: 1, max: 100 });
    expect(typeRange({ min: 3 }, "5 to 3 done")).toBe("3-5");
    expect(typeRange({ min: 3, max: 3 }, "done")).toBe("3");
  });

  it("reads a range typed as text, refusing what is not one", () => {
    expect(typedRange("8-12", counts)).toEqual({ min: 8, max: 12 });
    expect(typedRange(" 8 – 12 ", counts)).toEqual({ min: 8, max: 12 });
    expect(typedRange("5", counts)).toEqual({ min: 5 });
    expect(typedRange("5-3", counts)).toEqual({ min: 3, max: 5 });
    expect(typedRange("", counts)).toBeNull();
    expect(typedRange("a-3", counts)).toBeNull();
  });
});
