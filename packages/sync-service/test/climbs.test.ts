import { describe, expect, it } from "vitest";
import { climbCatalogue } from "../src/lib/climbs";

const session = (fingerprint: string, start_at: string, climbs: unknown[]) => ({
  fingerprint,
  start_at,
  climbs_json: JSON.stringify(climbs),
});

describe("climbCatalogue", () => {
  it("groups climbs by name across sessions, newest name and grade winning", () => {
    const catalogue = climbCatalogue(
      [
        session("s2", "2026-09-02T18:00:00Z", [
          { name: "Moonraker", grade: { scale: "v", value: 7 }, kind: "send", tries: 3 },
          { name: "moonraker", grade: { scale: "v", value: 7 }, kind: "attempt", tries: 2 },
          { name: "", vGrade: 2, kind: "send", tries: 1 },
        ]),
        session("s1", "2026-09-01T18:00:00Z", [
          { name: "MOONRAKER", vGrade: 6, kind: "attempt", tries: 4 },
          { name: "Warm up", vGrade: 2, kind: "send", tries: 1 },
        ]),
      ],
      []
    );
    expect(catalogue).toEqual([
      {
        slug: "moonraker",
        name: "Moonraker",
        grade: { scale: "v", value: 7 },
        project: false,
        sessions: 2,
        attempts: 9,
        sends: 1,
        first_at: "2026-09-01T18:00:00Z",
        last_at: "2026-09-02T18:00:00Z",
      },
      {
        slug: "warm-up",
        name: "Warm up",
        grade: { scale: "v", value: 2 },
        project: false,
        sessions: 1,
        attempts: 1,
        sends: 1,
        first_at: "2026-09-01T18:00:00Z",
        last_at: "2026-09-01T18:00:00Z",
      },
    ]);
  });

  it("flags projects and lists one that has no session yet", () => {
    const catalogue = climbCatalogue(
      [session("s1", "2026-09-01T18:00:00Z", [{ name: "Moonraker", vGrade: 6, kind: "attempt" }])],
      [
        {
          user_id: "u",
          slug: "moonraker",
          name: "Moonraker",
          grade_json: '{"scale":"v","value":6}',
          created_at: "2026-08-01T00:00:00Z",
        },
        {
          user_id: "u",
          slug: "dreamcatcher",
          name: "Dreamcatcher",
          grade_json: '{"scale":"yds","value":"5.14a"}',
          created_at: "2026-09-05T00:00:00Z",
        },
      ]
    );
    expect(catalogue.map((c) => [c.slug, c.project, c.sessions, c.attempts])).toEqual([
      ["dreamcatcher", true, 0, 0],
      ["moonraker", true, 1, 1],
    ]);
    expect(catalogue[0]?.grade).toEqual({ scale: "yds", value: "5.14a" });
  });
});
