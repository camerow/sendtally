import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import { climbCountLabel, sessionDay, sessionMetaLabel } from "./meta";

function session(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    fingerprint: "fp",
    board: null,
    source: "manual",
    location: "indoor",
    name: null,
    start_at: "2026-09-07T18:00:00.000Z",
    end_at: "2026-09-07T19:40:00.000Z",
    climb_count: 14,
    top_grade: 7,
    top_send_grade: 6,
    top_grade_label: null,
    top_send_grade_label: null,
    rpe: 7,
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    inProgress: false,
    tags: [],
    ...overrides,
  };
}

describe("sessionMetaLabel", () => {
  it("joins duration, climbs and RPE", () => {
    expect(sessionMetaLabel(session())).toBe("1h 40m · 14 climbs · RPE 7/10");
  });

  it("leaves the RPE off while a session is in progress", () => {
    expect(
      sessionMetaLabel(
        session({ inProgress: true, climb_count: 1, end_at: "2026-09-07T18:40:00.000Z" })
      )
    ).toBe("40m · 1 climb");
  });
});

describe("climbCountLabel", () => {
  it("pluralises", () => {
    expect(climbCountLabel(1)).toBe("1 climb");
    expect(climbCountLabel(0)).toBe("0 climbs");
  });
});

describe("sessionDay", () => {
  it("reads the weekday and day of month in UTC", () => {
    expect(sessionDay(session())).toEqual({ weekday: "MON", day: 7 });
    expect(sessionDay(session({ start_at: "2025-12-31T23:30:00.000Z" }))).toEqual({
      weekday: "WED",
      day: 31,
    });
  });
});
