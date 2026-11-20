import { describe, expect, it } from "vitest";
import type { ImportSession } from "@sendtally/core/import";
import { DEFAULT_GRADE_SCALES as SCALES } from "../settings/transforms";
import { historyCard, importedInsights, yearDate } from "./historyCard";

const NOW = new Date("2026-11-20T12:00:00");

const day = (
  date: string,
  climbs: { v: number; kind: "send" | "attempt"; style?: "flash" }[],
  location: "indoor" | "outdoor" = "outdoor"
): ImportSession => ({
  date,
  location,
  rows: [],
  climbs: climbs.map(({ v, kind, style }) => ({
    name: "",
    grade: { scale: "v", value: v },
    kind,
    tries: 1,
    ...(style === undefined ? {} : { style }),
  })),
});

describe("historyCard", () => {
  it("counts a file's climbs, its years and each year's hardest send", () => {
    const card = historyCard(
      importedInsights([
        day("2022-07-01", [{ v: 4, kind: "send", style: "flash" }]),
        day("2023-07-01", [
          { v: 6, kind: "send" },
          { v: 5, kind: "send" },
        ]),
        day("2024-03-02", [
          { v: 6, kind: "send" },
          { v: 7, kind: "attempt" },
        ]),
      ]),
      [],
      SCALES,
      NOW
    );
    expect(card).toMatchObject({
      discipline: "boulder",
      climbs: 5,
      sessions: 3,
      days: 3,
      since: 2022,
      years: 5,
      hardestYear: 2023,
    });
    expect(card.byYear.map((y) => `${y.year} ${y.gradeLabel}`)).toEqual([
      "2022 V4",
      "2023 V6",
      "2024 V6",
    ]);
    expect(card.stats).toMatchObject({ sends: 4, flashed: 1, avgSend: "V5" });
    expect(card.stats.pyramid.map((r) => r.gradeLabel)).toEqual(["V7", "V6", "V5", "V4"]);
  });

  it("is empty with nothing logged", () => {
    expect(historyCard([], [], SCALES, NOW)).toMatchObject({
      climbs: 0,
      since: null,
      years: 0,
      hardestYear: null,
      byYear: [],
    });
  });
});

describe("yearDate", () => {
  it("is 1 July of a past year", () => {
    expect(yearDate(2023, NOW)).toBe("2023-07-01");
  });

  it("is today while 1 July is still ahead", () => {
    expect(yearDate(2026, new Date("2026-03-04T12:00:00"))).toBe("2026-03-04");
  });
});
