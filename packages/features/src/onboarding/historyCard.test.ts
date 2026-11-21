import { describe, expect, it } from "vitest";
import type { ImportSession } from "@sendtally/core/import";
import { DEFAULT_GRADE_SCALES as SCALES } from "../settings/transforms";
import {
  cardMeta,
  historyCard,
  importedInsights,
  keepCopy,
  nextUnlock,
  revealLine,
  yearDate,
} from "./historyCard";

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
      SCALES
    );
    expect(card).toMatchObject({
      discipline: "boulder",
      climbs: 5,
      sessions: 3,
      days: 3,
      since: 2022,
      years: 3,
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
    expect(historyCard([], [], SCALES)).toMatchObject({
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

describe("the card's words", () => {
  const card = (climbs: number) =>
    historyCard(
      importedInsights(
        Array.from({ length: climbs }, (_, i) =>
          day(`${2022 + (i % 2)}-07-01`, [{ v: 3 + i, kind: "send" }])
        )
      ),
      [],
      SCALES
    );

  it("says what the next climbs unlock", () => {
    expect(nextUnlock(0)).toEqual({ text: "Add a climb and your pyramid starts here." });
    expect(nextUnlock(1)).toEqual({
      before: "",
      more: "2 more",
      after: " and you get your average send.",
    });
    expect(nextUnlock(4)).toMatchObject({ more: "1 more" });
    expect(nextUnlock(5)).toBeNull();
  });

  it("counts climbs and years on the card and the reveal", () => {
    expect(cardMeta(card(3))).toBe("3 climbs · since 2022");
    expect(revealLine(card(3), false)).toBe("across 2 years · since 2022");
    expect(revealLine(card(3), true)).toBe("3 sessions · 2 years · since 2022");
  });

  it("offers to keep the years with the user's own sends", () => {
    expect(keepCopy(card(3))).toEqual({
      title: "Keep all 2 years in view.",
      body: "Join now to start tracking and understanding your climbing history.",
      rows: [
        { eyebrow: "Sends by grade", text: "3 sends, V3 to V5" },
        { eyebrow: "Hardest send by year", text: "V5 in 2022, back to 2022" },
        { eyebrow: "Every range", text: "A month, a year, all time, on every Stats screen" },
      ],
    });
  });
});
