import { describe, expect, it } from "vitest";
import type { JournalEntry, SessionRow } from "@sendtally/api-client";
import {
  effortDayLabel,
  injuriesCarriedIn,
  tripContents,
  tripDays,
  tripEffort,
  tripStats,
} from "./trips";

function entry(overrides: Partial<JournalEntry>): JournalEntry {
  return {
    id: "e",
    kind: "journal",
    occurred_at: "2026-05-22",
    ends_at: null,
    title: null,
    body: "",
    fingerprints: [],
    parent_id: null,
    severity: null,
    status: null,
    created_at: "2026-05-22T20:00:00.000Z",
    updated_at: "2026-05-22T20:00:00.000Z",
    tags: [],
    ...overrides,
  };
}

function session(
  fingerprint: string,
  startAt: string,
  overrides: Partial<SessionRow> = {}
): SessionRow {
  return {
    fingerprint,
    board: null,
    source: "manual",
    location: "outdoor",
    gym_id: null,
    area_id: null,
    name: null,
    start_at: startAt,
    end_at: new Date(Date.parse(startAt) + 60 * 60_000).toISOString(),
    times: "both",
    climb_count: 10,
    top_grade: 7,
    top_send_grade: 5,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 6,
    rpe_source: "computed",
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags: [],
    ...overrides,
  };
}

const now = new Date("2026-06-10T12:00:00.000Z");
const trip = entry({ id: "trip", kind: "trip", occurred_at: "2026-05-22", ends_at: "2026-05-24" });
const sessions = [
  session("sat", "2026-05-23T09:00:00.000Z", {
    rpe: 9,
    top_send_grade: 6,
    top_send_grade_label: "7A",
  }),
  session("sun", "2026-05-24T09:00:00.000Z", { rpe: 3 }),
  session("after", "2026-05-25T09:00:00.000Z"),
];
const entries = [
  trip,
  entry({ id: "wet", occurred_at: "2026-05-22" }),
  entry({ id: "a2", kind: "injury", occurred_at: "2026-05-18", status: "ongoing" }),
  entry({ id: "old", kind: "injury", occurred_at: "2026-01-02", ends_at: "2026-02-01" }),
  entry({ id: "u1", occurred_at: "2026-05-23", parent_id: "a2", severity: 4 }),
];

describe("tripDays", () => {
  it("lays every day out with what was logged on it, updates included", () => {
    const days = tripDays(trip, sessions, entries, now);
    expect(
      days.map((d) => [
        d.n,
        d.day,
        d.sessions.map((s) => s.fingerprint),
        d.entries.map((e) => e.id),
        d.updates.map((u) => u.id),
      ])
    ).toEqual([
      [1, "2026-05-22", [], ["wet"], []],
      [2, "2026-05-23", ["sat"], [], ["u1"]],
      [3, "2026-05-24", ["sun"], [], []],
    ]);
    expect(tripEffort(days)).toEqual([null, 9, 3]);
  });

  it("sums the trip up from its sessions", () => {
    expect(tripStats(tripDays(trip, sessions, entries, now)).map((s) => s.value)).toEqual([
      "2/3",
      "2",
      "2h",
      "20",
      "7A",
      "6.0",
    ]);
  });
});

describe("tripContents", () => {
  it("previews a draft before it has an id", () => {
    const draft = { id: null, occurred_at: "2026-05-22", ends_at: "2026-05-23" };
    const inside = tripContents(draft, sessions, entries, now);
    expect(inside.sessions.map((s) => s.fingerprint)).toEqual(["sat"]);
    expect(inside.entries.map((e) => e.id)).toEqual(["wet"]);
  });
});

describe("effortDayLabel", () => {
  it("names every day of a short trip and only the ends of a long one", () => {
    expect([0, 1, 2].map((i) => effortDayLabel(i, 3))).toEqual(["1", "2", "3"]);
    expect([0, 1, 59].map((i) => effortDayLabel(i, 60))).toEqual(["1", "", "60"]);
  });
});

describe("injuriesCarriedIn", () => {
  it("names injuries still going when the trip started", () => {
    expect(injuriesCarriedIn(trip, entries).map((e) => e.id)).toEqual(["a2"]);
  });
});
