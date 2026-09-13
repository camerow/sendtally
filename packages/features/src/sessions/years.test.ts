import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import {
  countLabel,
  durationLabel,
  sessionMinutes,
  sessionTotals,
  sessionYearGroups,
  totalsLabel,
} from "./years";

function session(
  fingerprint: string,
  startAt: string,
  endAt: string,
  grades: { top: number; send: number } = { top: 6, send: 6 }
): SessionRow {
  return {
    fingerprint,
    board: null,
    source: "manual",
    location: "indoor",
    name: null,
    start_at: startAt,
    end_at: endAt,
    climb_count: 3,
    top_grade: grades.top,
    top_send_grade: grades.send,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 7,
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags: [],
  };
}

const sessions = [
  session("a", "2026-08-20T18:00:00.000Z", "2026-08-20T19:30:00.000Z", { top: 7, send: 6 }),
  session("b", "2026-08-02T18:00:00.000Z", "2026-08-02T19:00:00.000Z", { top: 5, send: 5 }),
  session("c", "2026-05-11T18:00:00.000Z", "2026-05-11T20:00:00.000Z", { top: 8, send: 6 }),
  session("d", "2025-12-31T22:00:00.000Z", "2025-12-31T23:30:00.000Z", { top: 4, send: 4 }),
];

describe("sessionYearGroups", () => {
  it("nests months under years, newest first", () => {
    const years = sessionYearGroups(sessions);
    expect(years.map((y) => y.year)).toEqual([2026, 2025]);
    expect(years[0]?.months.map((m) => m.key)).toEqual(["2026-08", "2026-05"]);
    expect(years[1]?.months.map((m) => m.key)).toEqual(["2025-12"]);
  });

  it("rolls up totals across every month in the year", () => {
    const [first, second] = sessionYearGroups(sessions);
    expect(first?.totals).toEqual({ count: 3, minutes: 270, topGrade: 8, topGradeLabel: null });
    expect(second?.totals).toEqual({ count: 1, minutes: 90, topGrade: 4, topGradeLabel: null });
  });

  it("returns nothing for an empty history", () => {
    expect(sessionYearGroups([])).toEqual([]);
  });
});

describe("sessionTotals", () => {
  it("reports an unknown top grade as -1", () => {
    const unknown = session("e", "2026-01-01T10:00:00.000Z", "2026-01-01T11:00:00.000Z", {
      top: -1,
      send: -1,
    });
    expect(sessionTotals([unknown]).topGrade).toBe(-1);
  });

  it("never reports negative minutes when a session ends before it starts", () => {
    const backwards = session("f", "2026-01-01T11:00:00.000Z", "2026-01-01T10:00:00.000Z");
    expect(sessionMinutes(backwards)).toBe(0);
  });
});

describe("labels", () => {
  it("formats durations", () => {
    expect(durationLabel(45)).toBe("45m");
    expect(durationLabel(60)).toBe("1h");
    expect(durationLabel(102)).toBe("1h 42m");
  });

  it("singularises one session", () => {
    expect(countLabel(1)).toBe("1 SESSION");
    expect(countLabel(9)).toBe("9 SESSIONS");
  });

  it("drops the top grade when it is unknown", () => {
    expect(totalsLabel({ count: 2, minutes: 90, topGrade: -1, topGradeLabel: null })).toBe(
      "2 SESSIONS · 1H 30M"
    );
    expect(totalsLabel({ count: 2, minutes: 90, topGrade: 6, topGradeLabel: null })).toBe(
      "2 SESSIONS · 1H 30M · TOP V6"
    );
  });

  it("shows the stored label for the hardest session, route grades included", () => {
    expect(totalsLabel({ count: 1, minutes: 60, topGrade: 4, topGradeLabel: "5.12b" })).toBe(
      "1 SESSION · 1H · TOP 5.12b"
    );
  });
});
