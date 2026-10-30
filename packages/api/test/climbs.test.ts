import { describe, expect, it } from "vitest";
import { climbCatalogue, missingClimbs, restampedSessions } from "../src/lib/climbs";
import type { UserClimbRow } from "../src/lib/repo";

const session = (fingerprint: string, start_at: string, climbs: unknown[], area_id?: string) => ({
  fingerprint,
  start_at,
  source: "manual",
  area_id: area_id ?? null,
  climbs_json: JSON.stringify(climbs),
});

const record = (id: string, name: string, overrides: Partial<UserClimbRow> = {}): UserClimbRow => ({
  user_id: "u",
  id,
  name,
  name_key: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  discipline: "boulder",
  grade_json: null,
  area_climb_id: null,
  working: false,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
  ...overrides,
});

describe("climbCatalogue", () => {
  it("groups climbs by their record across sessions, newest grade and crag winning", () => {
    const catalogue = climbCatalogue(
      [
        session(
          "s2",
          "2026-09-02T18:00:00Z",
          [
            { name: "Moonraker", grade: { scale: "v", value: 7 }, kind: "send", tries: 3 },
            { name: "moonraker", grade: { scale: "v", value: 7 }, kind: "attempt", tries: 2 },
            { name: "", vGrade: 2, kind: "send", tries: 1 },
          ],
          "a1"
        ),
        session("s1", "2026-09-01T18:00:00Z", [
          { name: "MOONRAKER", vGrade: 6, kind: "attempt", tries: 4 },
          { name: "Warm up", vGrade: 2, kind: "send", tries: 1 },
        ]),
      ],
      [record("m", "Moonraker"), record("w", "Warm up")],
      new Map([["a1", "Buttermilks"]])
    );
    expect(catalogue).toEqual([
      {
        id: "m",
        slug: "moonraker",
        name: "Moonraker",
        grade: { scale: "v", value: 7 },
        discipline: "boulder",
        project: false,
        area_climb_id: null,
        area: { id: "a1", name: "Buttermilks" },
        sessions: 2,
        attempts: 9,
        sends: 1,
        first_at: "2026-09-01T18:00:00Z",
        last_at: "2026-09-02T18:00:00Z",
        sent_at: "2026-09-02T18:00:00Z",
      },
      {
        id: "w",
        slug: "warm-up",
        name: "Warm up",
        grade: { scale: "v", value: 2 },
        discipline: "boulder",
        project: false,
        area_climb_id: null,
        area: null,
        sessions: 1,
        attempts: 1,
        sends: 1,
        first_at: "2026-09-01T18:00:00Z",
        last_at: "2026-09-01T18:00:00Z",
        sent_at: "2026-09-01T18:00:00Z",
      },
    ]);
  });

  it("lists a working climb with no session yet and leaves out an idle one", () => {
    const catalogue = climbCatalogue(
      [session("s1", "2026-09-01T18:00:00Z", [{ name: "Moonraker", vGrade: 6, kind: "attempt" }])],
      [
        record("m", "Moonraker", { working: true }),
        record("d", "Dreamcatcher", {
          working: true,
          discipline: "route",
          created_at: "2026-09-05T00:00:00Z",
        }),
        record("i", "Idle"),
      ]
    );
    expect(catalogue.map((c) => [c.slug, c.project, c.sessions, c.attempts])).toEqual([
      ["dreamcatcher", true, 0, 0],
      ["moonraker", true, 1, 1],
    ]);
    expect(catalogue[0]?.grade).toBeNull();
    expect(catalogue[0]?.discipline).toBe("route");
  });

  it("follows a stamped id over the logged name", () => {
    const catalogue = climbCatalogue(
      [session("s1", "2026-09-01T18:00:00Z", [{ name: "Old name", userClimbId: "x", vGrade: 3 }])],
      [record("x", "New name")]
    );
    expect(catalogue.map((c) => [c.id, c.name])).toEqual([["x", "New name"]]);
  });
});

describe("missingClimbs", () => {
  it("creates a record per unrecorded name and links records to their Areas climb", () => {
    const missing = missingClimbs(
      [
        session("s1", "2026-09-01T18:00:00Z", [
          { name: "The Pinch", grade: { scale: "v", value: 7 } },
          { name: "the pinch", grade: { scale: "v", value: 6 } },
          { name: "Known", vGrade: 2 },
        ]),
      ],
      [record("k", "Known")],
      [
        { climb_slug: "the-pinch", climb_id: "ac1" },
        { climb_slug: "known", climb_id: "ac2" },
      ]
    );
    expect(missing).toEqual({
      create: [
        {
          name: "The Pinch",
          name_key: "the-pinch",
          discipline: "boulder",
          grade_json: '{"scale":"v","value":7}',
          area_climb_id: "ac1",
        },
      ],
      link: [{ id: "k", area_climb_id: "ac2" }],
    });
  });
});

describe("restampedSessions", () => {
  it("stamps every manual climb that resolves to the renamed record", () => {
    const records = [record("a", "Arete"), record("b", "Blue roof")];
    const stamped = restampedSessions(
      [
        session("s1", "2026-09-01T18:00:00Z", [{ name: "Arete" }, { name: "Blue roof" }]),
        session("s2", "2026-09-02T18:00:00Z", [{ name: "Blue roof" }]),
        { ...session("s3", "2026-09-03T18:00:00Z", [{ name: "Arete" }]), source: "board" },
      ],
      records,
      records[0]!,
      "b"
    );
    expect(stamped).toEqual([
      {
        fingerprint: "s1",
        climbs_json: JSON.stringify([{ name: "Arete", userClimbId: "b" }, { name: "Blue roof" }]),
      },
    ]);
  });
});
