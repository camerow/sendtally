import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import { monthScopeItems, tagScopeItems } from "./scope";
import { sessionTagGroups } from "./tags";
import { sessionYearGroups } from "./years";

function session(fingerprint: string, startAt: string, tags: string[] = []): SessionRow {
  return {
    fingerprint,
    board: null,
    source: "manual",
    location: "indoor",
    name: null,
    start_at: startAt,
    end_at: startAt,
    climb_count: 3,
    top_grade: 6,
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
    tags: tags.map((name) => ({ id: name, slug: name, name })),
  };
}

const sessions = [
  session("a", "2026-08-20T18:00:00.000Z", ["gym"]),
  session("b", "2026-05-02T18:00:00.000Z", ["gym", "projects"]),
  session("c", "2025-12-11T18:00:00.000Z"),
];

describe("monthScopeItems", () => {
  it("lists each year followed by its months, newest first", () => {
    const items = monthScopeItems(sessionYearGroups(sessions));
    expect(items.map((i) => i.label)).toEqual(["2026", "AUG", "MAY", "2025", "DEC"]);
    expect(items.map((i) => i.kind)).toEqual(["year", "month", "month", "year", "month"]);
  });

  it("points a year at its newest month", () => {
    const items = monthScopeItems(sessionYearGroups(sessions));
    expect(items[0]?.sectionKey).toBe("2026-08");
    expect(items[3]?.sectionKey).toBe("2025-12");
  });

  it("returns nothing for no sessions", () => {
    expect(monthScopeItems([])).toEqual([]);
  });
});

describe("tagScopeItems", () => {
  it("mirrors the tag groups with uppercase labels", () => {
    const items = tagScopeItems(sessionTagGroups(sessions));
    expect(items.map((i) => i.label)).toEqual(["GYM", "PROJECTS", "UNTAGGED"]);
    expect(items.map((i) => i.sectionKey)).toEqual(["gym", "projects", "untagged"]);
    expect(items.every((i) => i.kind === "tag")).toBe(true);
  });
});
