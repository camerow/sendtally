import { describe, expect, it } from "vitest";
import type { JournalEntry, SessionRow } from "@sendtally/api-client";
import {
  daysSince,
  draftFromEntry,
  draftIsEmpty,
  emptyDraft,
  entryHasTitle,
  entryInput,
  entryTitle,
  groupTrips,
  linkedSessions,
  logItems,
  logScopeItems,
  openInjuries,
  overlappingTrip,
  sessionsInSpan,
  sessionsNearPoints,
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
    gym_id: null,
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

describe("groupTrips", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");
  const trip = entry({
    id: "trip",
    kind: "trip",
    occurred_at: "2026-05-22",
    ends_at: "2026-05-26",
  });

  it("folds everything logged inside a trip's dates under it", () => {
    const items = logItems(
      [
        session("before", "2026-05-21T18:00:00.000Z"),
        session("first", "2026-05-22T09:00:00.000Z"),
        session("last", "2026-05-26T23:00:00.000Z"),
      ],
      [
        trip,
        entry({ id: "note", occurred_at: "2026-05-24" }),
        entry({ id: "tip", kind: "injury", occurred_at: "2026-05-24", ends_at: "2026-06-02" }),
        entry({ id: "a2", kind: "injury", occurred_at: "2026-05-18" }),
      ]
    );
    const grouped = groupTrips(items, now);
    expect(grouped.map((i) => i.key)).toEqual(["entry:trip", "session:before", "entry:a2"]);
    const [head] = grouped;
    expect(head?.type === "entry" ? head.inside.map((i) => i.key) : []).toEqual([
      "session:last",
      "entry:note",
      "entry:tip",
      "session:first",
    ]);
  });

  it("runs a trip with no end date up to today", () => {
    const away = entry({ id: "away", kind: "trip", occurred_at: "2026-06-08" });
    const grouped = groupTrips(
      logItems(
        [
          session("today", "2026-06-10T09:00:00.000Z"),
          session("later", "2026-06-11T09:00:00.000Z"),
        ],
        [away]
      ),
      now
    );
    expect(grouped.map((i) => i.key)).toEqual(["session:later", "entry:away"]);
  });
});

describe("overlappingTrip", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");
  const easter = entry({
    id: "easter",
    kind: "trip",
    occurred_at: "2026-04-03",
    ends_at: "2026-04-06",
  });

  it("finds a trip that shares a day", () => {
    const span = { id: null, occurred_at: "2026-04-06", ends_at: "2026-04-09" };
    expect(overlappingTrip([easter], span, now)?.id).toBe("easter");
  });

  it("lets a trip start the day after another ends, and ignores itself", () => {
    expect(
      overlappingTrip([easter], { id: null, occurred_at: "2026-04-07", ends_at: null }, now)
    ).toBeNull();
    expect(overlappingTrip([easter], { ...easter, ends_at: "2026-04-08" }, now)).toBeNull();
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

describe("logScopeItems", () => {
  const items = logItems(
    [session("a", "2026-05-22T09:00:00.000Z")],
    [
      entry({ id: "note", kind: "journal", fingerprints: ["a"] }),
      entry({ id: "free", kind: "journal" }),
      entry({ id: "hurt", kind: "injury", fingerprints: ["a"] }),
    ]
  );

  it("shows everything, a note on a session included", () => {
    expect(logScopeItems(items, "all").map((i) => i.key)).toEqual([
      "entry:note",
      "entry:free",
      "entry:hurt",
      "session:a",
    ]);
  });

  it("picks one kind of entry", () => {
    expect(logScopeItems(items, "injuries").map((i) => i.key)).toEqual(["entry:hurt"]);
    expect(logScopeItems(items, "trips")).toEqual([]);
  });

  it("shows each half on its own", () => {
    expect(logScopeItems(items, "sessions").map((i) => i.key)).toEqual(["session:a"]);
    expect(logScopeItems(items, "journal").map((i) => i.key)).toEqual([
      "entry:note",
      "entry:free",
      "entry:hurt",
    ]);
  });
});

describe("sessionsNearPoints", () => {
  it("counts the week up to each point", () => {
    const sessions = [
      session("a", "2026-05-16T09:00:00.000Z"),
      session("b", "2026-05-20T09:00:00.000Z"),
      session("c", "2026-05-23T09:00:00.000Z"),
    ];
    expect(
      sessionsNearPoints(sessions, [
        { at: "2026-05-22", severity: 6 },
        { at: "2026-05-29", severity: 3 },
      ])
    ).toEqual([2, 1]);
  });
});

describe("entryHasTitle", () => {
  it("ignores whitespace", () => {
    expect(entryHasTitle(entry({ title: "  " }))).toBe(false);
    expect(entryHasTitle(entry({ title: "Pulley" }))).toBe(true);
  });
});
