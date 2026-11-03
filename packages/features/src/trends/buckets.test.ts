import { afterEach, describe, expect, it, vi } from "vitest";
import { bucketsFor, priorWindow, windowOf } from "./buckets";
import { defaultRange, shownRange, trendRanges, yearsOf } from "./types";

afterEach(() => vi.restoreAllMocks());

describe("bucketsFor", () => {
  it("ends the week on the climber's today, not UTC's, on an evening west of Greenwich", () => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(420);
    const evening = new Date("2026-10-29T00:30:00Z");
    const days = bucketsFor("7d", evening, null);
    expect(new Date(days[6]!.start).toISOString().slice(0, 10)).toBe("2026-10-28");
  });
});

const day = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

describe("calendar year ranges", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  const noOffset = (): void => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(0);
  };

  it("buckets a past year by month, January to December", () => {
    noOffset();
    const months = bucketsFor("y2025", now, null);
    expect(months).toHaveLength(12);
    expect(day(months[0]!.start)).toBe("2025-01-01");
    expect(day(months[11]!.end)).toBe("2026-01-01");
  });

  it("buckets the current year January to now", () => {
    noOffset();
    const months = bucketsFor("y2026", now, null);
    expect(months).toHaveLength(11);
    expect(day(months[10]!.start)).toBe("2026-11-01");
  });

  it("compares a year against the same months of the year before", () => {
    noOffset();
    const window = windowOf(bucketsFor("y2026", now, null));
    const prior = priorWindow("y2026", window)!;
    expect([day(prior.start), day(prior.end)]).toEqual(["2025-01-01", "2025-12-01"]);
    expect(priorWindow("y2025", windowOf(bucketsFor("y2025", now, null)))).toEqual({
      start: Date.UTC(2024, 0, 1),
      end: Date.UTC(2025, 0, 1),
    });
  });

  it("keeps the trailing ranges' delta the same length just before, and none for All", () => {
    const window = { start: 100, end: 160 };
    expect(priorWindow("1m", window)).toEqual({ start: 40, end: 100 });
    expect(priorWindow("all", window)).toBeNull();
  });
});

describe("range chips", () => {
  it("runs longest first: All, the years with sessions newest first, then trailing ranges", () => {
    const years = yearsOf(["2022-03-01", "2026-01-02T10:00:00Z", "2025-05-05", "2026-04-01"]);
    expect(years).toEqual([2026, 2025, 2022]);
    expect(trendRanges(years)).toEqual([
      "all",
      "y2026",
      "y2025",
      "y2022",
      "1y",
      "6m",
      "3m",
      "1m",
      "7d",
    ]);
  });

  it("opens on All for a member and the free 7D for anyone else", () => {
    expect(defaultRange(true)).toBe("all");
    expect(defaultRange(false)).toBe("7d");
    expect(defaultRange(null)).toBe("7d");
    expect(shownRange(false, "y2025")).toBe("7d");
  });
});
