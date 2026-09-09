import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import { sessionMonths } from "./months";

function session(fingerprint: string, startAt: string): SessionRow {
  return {
    fingerprint,
    board: "tension",
    source: "board",
    location: null,
    name: null,
    start_at: startAt,
    end_at: startAt,
    climb_count: 3,
    top_grade: 6,
    top_send_grade: 6,
    rpe: 7,
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    inProgress: false,
    tags: [],
  };
}

const sessions = [
  session("a", "2026-08-20T18:00:00.000Z"),
  session("b", "2026-08-02T18:00:00.000Z"),
  session("c", "2026-05-11T18:00:00.000Z"),
  session("d", "2025-12-31T23:30:00.000Z"),
];

describe("sessionMonths", () => {
  it("groups sessions by UTC month, newest month first", () => {
    const months = sessionMonths(sessions);
    expect(months.map((m) => m.key)).toEqual(["2026-08", "2026-05", "2025-12"]);
    expect(months[0]?.label).toBe("August 2026");
    expect(months[0]?.name).toBe("August");
    expect(months[0]?.sessions.map((s) => s.fingerprint)).toEqual(["a", "b"]);
    expect(months[2]?.label).toBe("December 2025");
  });

  it("returns nothing for no sessions", () => {
    expect(sessionMonths([])).toEqual([]);
  });
});
