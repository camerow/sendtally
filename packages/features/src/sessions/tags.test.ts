import { describe, expect, it } from "vitest";
import type { SessionRow, SessionTag } from "@sendtally/api-client";
import {
  UNTAGGED_KEY,
  filterSessionsByTags,
  sameTagName,
  sessionTagGroups,
  sessionTagOptions,
} from "./tags";

function tag(name: string): SessionTag {
  return { id: `id-${name}`, name, slug: name.toLowerCase().replace(/\s+/g, "-") };
}

function session(fingerprint: string, tags: SessionTag[]): SessionRow {
  return {
    fingerprint,
    board: null,
    source: "manual",
    location: "indoor",
    name: fingerprint,
    start_at: "2026-03-01T18:00:00.000Z",
    end_at: "2026-03-01T20:00:00.000Z",
    climb_count: 10,
    top_grade: 6,
    top_send_grade: 5,
    top_grade_label: null,
    top_send_grade_label: null,
    rpe: 6,
    title: fingerprint,
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    inProgress: false,
    tags,
  };
}

const endurance = tag("Endurance");
const bishop = tag("Bishop");

const sessions = [session("a", [endurance, bishop]), session("b", [endurance]), session("c", [])];

describe("sessionTagOptions", () => {
  it("counts each tag and ranks the most used first", () => {
    expect(sessionTagOptions(sessions)).toEqual([
      { slug: "endurance", name: "Endurance", count: 2 },
      { slug: "bishop", name: "Bishop", count: 1 },
    ]);
  });

  it("is empty when nothing is tagged", () => {
    expect(sessionTagOptions([session("x", [])])).toEqual([]);
  });
});

describe("filterSessionsByTags", () => {
  it("returns everything when nothing is selected", () => {
    expect(filterSessionsByTags(sessions, [])).toHaveLength(3);
  });

  it("keeps a session carrying any of the selected tags", () => {
    expect(filterSessionsByTags(sessions, ["bishop"]).map((s) => s.fingerprint)).toEqual(["a"]);
    expect(filterSessionsByTags(sessions, ["endurance"]).map((s) => s.fingerprint)).toEqual([
      "a",
      "b",
    ]);
  });

  it("unions across several selected tags without repeating a session", () => {
    expect(
      filterSessionsByTags(sessions, ["endurance", "bishop"]).map((s) => s.fingerprint)
    ).toEqual(["a", "b"]);
  });

  it("selects untagged sessions on their own key", () => {
    expect(filterSessionsByTags(sessions, [UNTAGGED_KEY]).map((s) => s.fingerprint)).toEqual(["c"]);
  });
});

describe("sessionTagGroups", () => {
  it("puts a session in a group per tag and untagged sessions last", () => {
    expect(
      sessionTagGroups(sessions).map((g) => [g.key, g.sessions.map((s) => s.fingerprint)])
    ).toEqual([
      ["endurance", ["a", "b"]],
      ["bishop", ["a"]],
      [UNTAGGED_KEY, ["c"]],
    ]);
  });

  it("omits the untagged group when every session is tagged", () => {
    expect(sessionTagGroups([session("a", [endurance])]).map((g) => g.key)).toEqual(["endurance"]);
  });
});

describe("sameTagName", () => {
  it("ignores case and surrounding space", () => {
    expect(sameTagName(" Bishop ", "bishop")).toBe(true);
    expect(sameTagName("Bishop", "Bishop Hills")).toBe(false);
  });
});
