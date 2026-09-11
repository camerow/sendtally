import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import { sessionTitle } from "./title";

function session(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    fingerprint: "fp",
    board: "tension",
    source: "board",
    location: null,
    name: null,
    start_at: "2026-08-08T18:00:00.000Z",
    end_at: "2026-08-08T19:00:00.000Z",
    climb_count: 3,
    top_grade: 6,
    top_send_grade: 6,
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
    ...overrides,
  };
}

describe("sessionTitle", () => {
  it("prefers the user-given name", () => {
    expect(sessionTitle(session({ name: "Tuesday board night" }))).toBe("Tuesday board night");
  });

  it("labels unnamed manual sessions", () => {
    expect(sessionTitle(session({ source: "manual", board: null }))).toBe("Logged session");
  });

  it("labels legacy board sessions by their board", () => {
    expect(sessionTitle(session())).toBe("Tension Board");
    expect(sessionTitle(session({ board: "unknown-board" }))).toBe("Board session");
  });
});
