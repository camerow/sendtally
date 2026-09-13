import { describe, expect, it } from "vitest";
import type { ClimbSummary } from "@sendtally/api-client";
import { gradeOptions } from "../log-session/transforms";
import {
  climbDraftGrade,
  findClimb,
  matchClimbs,
  projectMetaLabel,
  projectStatus,
  projectsOf,
  typicalGradeIndex,
} from "./transforms";

const climb = (overrides: Partial<ClimbSummary>): ClimbSummary => ({
  slug: "moonraker",
  name: "Moonraker",
  grade: { scale: "v", value: 6 },
  discipline: "boulder",
  project: false,
  beta: null,
  beta_updated_at: null,
  sessions: 3,
  attempts: 11,
  sends: 0,
  first_at: "2026-08-01T18:00:00Z",
  last_at: "2026-09-01T18:00:00Z",
  ...overrides,
});

describe("matchClimbs", () => {
  const climbs = [
    climb({}),
    climb({ slug: "moon-dance", name: "Moon Dance" }),
    climb({ slug: "warm-up", name: "Warm up" }),
  ];

  it("matches anywhere in the name, case-insensitively", () => {
    expect(matchClimbs(climbs, "moo").map((c) => c.name)).toEqual(["Moonraker", "Moon Dance"]);
    expect(matchClimbs(climbs, "DANCE").map((c) => c.name)).toEqual(["Moon Dance"]);
  });

  it("drops the climb already typed in full", () => {
    expect(matchClimbs(climbs, "moonraker").map((c) => c.name)).toEqual([]);
  });

  it("offers the most recent climbs for an empty query", () => {
    expect(matchClimbs(climbs, " ")).toHaveLength(3);
  });
});

describe("findClimb", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(findClimb([climb({})], "  moonRAKER ")?.slug).toBe("moonraker");
    expect(findClimb([climb({})], "")).toBeUndefined();
  });
});

describe("climbDraftGrade", () => {
  it("renders the stored grade in the draft's scale", () => {
    expect(climbDraftGrade(climb({}), "v")).toBe("V6");
    expect(climbDraftGrade(climb({}), "font")).toBe("7A");
    expect(climbDraftGrade(climb({ grade: { scale: "yds", value: "5.12a" } }), "french")).toBe(
      "7a+"
    );
  });
});

describe("projects", () => {
  it("lists open projects before sent ones, newest first", () => {
    const sent = climb({ slug: "a", project: true, sends: 1, last_at: "2026-09-05T00:00:00Z" });
    const older = climb({ slug: "b", project: true, last_at: "2026-08-05T00:00:00Z" });
    const newer = climb({ slug: "c", project: true, last_at: "2026-09-01T00:00:00Z" });
    expect(projectsOf([sent, older, newer, climb({})]).map((c) => c.slug)).toEqual(["c", "b", "a"]);
    expect(projectStatus(sent)).toBe("sent");
    expect(projectStatus(older)).toBe("open");
  });

  it("labels totals with the right plurals", () => {
    expect(projectMetaLabel(climb({}))).toBe("3 SESSIONS · 11 ATTEMPTS");
    expect(projectMetaLabel(climb({ sessions: 1, attempts: 1 }))).toBe("1 SESSION · 1 ATTEMPT");
  });
});

describe("typicalGradeIndex", () => {
  it("lands on the middle of what the user has logged in that discipline", () => {
    const climbs = [
      climb({ slug: "a", grade: { scale: "v", value: 4 } }),
      climb({ slug: "b", grade: { scale: "v", value: 8 } }),
      climb({ slug: "c", grade: { scale: "yds", value: "5.13a" }, discipline: "route" }),
    ];
    expect(typicalGradeIndex(climbs, "v")).toBe(6);
  });

  it("converts into the scale being shown", () => {
    const climbs = [climb({ grade: { scale: "v", value: 6 } })];
    expect(gradeOptions("font")[typicalGradeIndex(climbs, "font")]).toBe("7A");
  });

  it("ignores the other discipline and climbs with no grade", () => {
    const climbs = [
      climb({ slug: "a", grade: { scale: "yds", value: "5.13a" }, discipline: "route" }),
      climb({ slug: "b", grade: null }),
    ];
    expect(typicalGradeIndex(climbs, "v")).toBe(Math.floor(gradeOptions("v").length / 3));
  });
});
