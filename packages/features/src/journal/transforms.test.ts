import { describe, expect, it } from "vitest";
import type { JournalEntry, SessionRow } from "@sendtally/api-client";
import {
  daysSince,
  draftFromEntry,
  draftIsEmpty,
  emptyDraft,
  entryInput,
  entryTitle,
  linkedSessions,
  logItems,
  openInjuries,
  sessionsInSpan,
  severitySeries,
} from "./transforms";

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "e1",
    kind: "journal",
    occurred_at: "2026-05-30",
    ends_at: null,
    title: null,
    body: "Good hour at the end.",
    fingerprints: [],
    parent_id: null,
    severity: null,
    status: null,
    created_at: "2026-05-30T20:00:00.000Z",
    updated_at: "2026-05-30T20:00:00.000Z",
    tags: [],
    ...overrides,
  };
}

function session(fingerprint: string, startAt: string): SessionRow {
  return {
    fingerprint,
    board: null,
    source: "manual",
    location: "indoor",
    name: null,
    start_at: startAt,
    end_at: startAt,
    climb_count: 3,
    top_grade: 5,
    top_send_grade: 5,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 6,
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags: [],
  };
}

describe("logItems", () => {
  it("interleaves sessions and entries newest first", () => {
    const items = logItems(
      [session("a", "2026-05-26T18:00:00.000Z"), session("b", "2026-05-30T18:00:00.000Z")],
      [entry({ id: "e1", occurred_at: "2026-05-28" })]
    );
    expect(items.map((i) => i.key)).toEqual(["session:b", "entry:e1", "session:a"]);
  });

  it("keeps thread updates out of the log - they belong to their parent", () => {
    const items = logItems([], [entry({ id: "u1", parent_id: "injury-1", severity: 4 })]);
    expect(items).toEqual([]);
  });

  it("sorts a date-only entry above a session earlier the same day", () => {
    const items = logItems(
      [session("a", "2026-05-30T09:00:00.000Z")],
      [entry({ id: "e1", occurred_at: "2026-05-30" })]
    );
    expect(items.map((i) => i.key)).toEqual(["entry:e1", "session:a"]);
  });
});

describe("sessionsInSpan", () => {
  it("matches sessions by date, so nothing has to be attached by hand", () => {
    const trip = entry({ kind: "trip", occurred_at: "2026-05-22", ends_at: "2026-05-26" });
    const inside = sessionsInSpan(
      [
        session("before", "2026-05-21T18:00:00.000Z"),
        session("first", "2026-05-22T09:00:00.000Z"),
        session("last", "2026-05-26T23:00:00.000Z"),
        session("after", "2026-05-27T09:00:00.000Z"),
      ],
      trip
    );
    expect(inside.map((s) => s.fingerprint)).toEqual(["first", "last"]);
  });

  it("treats an entry with no end as a single day", () => {
    const inside = sessionsInSpan([session("a", "2026-05-30T18:00:00.000Z")], entry());
    expect(inside.map((s) => s.fingerprint)).toEqual(["a"]);
  });
});

describe("severitySeries", () => {
  it("plots the onset and every numbered update, oldest first", () => {
    const injury = entry({ id: "i1", kind: "injury", occurred_at: "2026-05-18", severity: 8 });
    const points = severitySeries(injury, [
      entry({ id: "u2", occurred_at: "2026-06-08", parent_id: "i1", severity: 4 }),
      entry({ id: "u1", occurred_at: "2026-05-22", parent_id: "i1", severity: 7 }),
      entry({ id: "u3", occurred_at: "2026-06-12", parent_id: "i1", severity: null }),
    ]);
    expect(points).toEqual([
      { at: "2026-05-18", severity: 8 },
      { at: "2026-05-22", severity: 7 },
      { at: "2026-06-08", severity: 4 },
    ]);
  });

  it("plots nothing for an injury nobody has scored", () => {
    expect(severitySeries(entry({ kind: "injury" }), [])).toEqual([]);
  });
});

describe("drafts", () => {
  it("round-trips an entry through the composer", () => {
    const trip = entry({
      kind: "trip",
      occurred_at: "2026-05-22",
      ends_at: "2026-05-26",
      title: "Five days in Fontainebleau",
      tags: [{ id: "t1", name: "Outdoor", slug: "outdoor" }],
    });
    expect(entryInput(draftFromEntry(trip))).toMatchObject({
      kind: "trip",
      occurred_at: "2026-05-22",
      ends_at: "2026-05-26",
      title: "Five days in Fontainebleau",
      tags: ["Outdoor"],
    });
  });

  it("drops an end date when the kind cannot span one", () => {
    const draft = { ...emptyDraft("journal", "2026-05-30"), endsAt: "2026-06-01", body: "x" };
    expect(entryInput(draft).ends_at).toBeNull();
  });

  it("refuses an empty draft but accepts an update carrying only a number", () => {
    expect(draftIsEmpty(emptyDraft("journal", "2026-05-30"))).toBe(true);
    expect(
      draftIsEmpty({ ...emptyDraft("journal", "2026-05-30"), parentId: "i1", severity: 0 })
    ).toBe(false);
  });
});

describe("entryTitle", () => {
  it("borrows the first line when nothing was titled", () => {
    expect(entryTitle(entry({ body: "Shoulder held up.\nSecond line." }))).toBe(
      "Shoulder held up."
    );
  });

  it("falls back to the kind when there is nothing at all", () => {
    expect(entryTitle(entry({ kind: "injury", body: "  " }))).toBe("Injury");
  });
});

describe("openInjuries and daysSince", () => {
  it("finds what is still going", () => {
    const open = openInjuries([
      entry({ id: "i1", kind: "injury", status: "ongoing" }),
      entry({ id: "i2", kind: "injury", status: "resolved" }),
      entry({ id: "n1" }),
    ]);
    expect(open.map((e) => e.id)).toEqual(["i1"]);
  });

  it("counts whole days and never goes negative", () => {
    const now = new Date("2026-06-14T12:00:00.000Z");
    expect(daysSince("2026-05-18", now)).toBe(27);
    expect(daysSince("2026-07-01", now)).toBe(0);
  });
});

describe("linkedSessions", () => {
  it("returns the sessions an entry names, newest first", () => {
    const trip = entry({
      kind: "trip",
      fingerprints: ["b", "a"],
    });
    const linked = linkedSessions(
      [
        session("a", "2026-05-22T09:00:00.000Z"),
        session("b", "2026-05-24T09:00:00.000Z"),
        session("c", "2026-05-26T09:00:00.000Z"),
      ],
      trip
    );
    expect(linked.map((s) => s.fingerprint)).toEqual(["b", "a"]);
  });

  it("drops a link whose session is gone", () => {
    expect(linkedSessions([], entry({ fingerprints: ["gone"] }))).toEqual([]);
  });
});
