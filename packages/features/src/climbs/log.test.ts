import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { climbLog, gradeFilterLabel, inGradeRange, matchesClimbSearch } from "./log";

const NOW = new Date("2026-10-27T12:00:00.000Z");

const climb = (over: Partial<ClimbSummary>): ClimbSummary => ({
  id: "c1",
  slug: "pocket-rocket",
  name: "Pocket Rocket",
  grade: { scale: "font", value: "6B+" },
  discipline: "boulder",
  project: false,
  area_climb_id: null,
  area: { id: "a1", name: "Stanage Popular" },
  sessions: 1,
  attempts: 1,
  sends: 1,
  first_at: "2026-10-27T10:00:00.000Z",
  last_at: "2026-10-27T10:00:00.000Z",
  sent_at: "2026-10-27T10:00:00.000Z",
  ...over,
});

const ramp = climb({
  id: "c2",
  name: "The Ramp",
  grade: { scale: "french", value: "7a" },
  discipline: "route",
  project: true,
  area: { id: "a2", name: "Burbage North" },
  sessions: 3,
  attempts: 11,
  sends: 0,
  last_at: "2026-10-18T10:00:00.000Z",
  sent_at: null,
});

const brad = climb({
  id: "c3",
  name: "Brad Pit",
  grade: { scale: "font", value: "6C" },
  area: { id: "a3", name: "Stanage Plantation" },
  attempts: 3,
  sends: 0,
  last_at: "2026-09-04T10:00:00.000Z",
  sent_at: null,
});

const roof = climb({
  id: "c4",
  name: "Ben's Roof",
  grade: { scale: "font", value: "7A" },
  sessions: 2,
  last_at: "2025-12-01T10:00:00.000Z",
  sent_at: "2025-12-01T10:00:00.000Z",
});

const sessions = [
  {
    start_at: "2026-10-27T10:00:00.000Z",
    climbs: [{ name: "Pocket Rocket", kind: "send", style: "flash" } as SessionClimb],
  },
] as unknown as SessionWithClimbs[];

const all = { query: "", grade: null, status: "all" } as const;

describe("matchesClimbSearch", () => {
  it("finds a climb by its name, crag or grade, in any case", () => {
    expect(matchesClimbSearch(climb({}), "rocket")).toBe(true);
    expect(matchesClimbSearch(climb({}), "stanage")).toBe(true);
    expect(matchesClimbSearch(climb({}), "6b+")).toBe(true);
    expect(matchesClimbSearch(climb({}), "6C")).toBe(false);
    expect(matchesClimbSearch(climb({}), "  ")).toBe(true);
  });
});

describe("inGradeRange", () => {
  const range = { scale: "font", from: "6B+", to: "7A" } as const;

  it("keeps the climbs between the two grades, whichever way round they were picked", () => {
    expect(inGradeRange(climb({}), range)).toBe(true);
    expect(inGradeRange(roof, { ...range, from: "7A", to: "6B+" })).toBe(true);
    expect(inGradeRange(climb({ grade: { scale: "font", value: "6A" } }), range)).toBe(false);
  });

  it("reads a V grade on the range's scale and leaves out the other discipline", () => {
    expect(inGradeRange(climb({ grade: { scale: "v", value: 5 } }), range)).toBe(true);
    expect(inGradeRange(ramp, range)).toBe(false);
    expect(inGradeRange(climb({ grade: null }), range)).toBe(false);
  });

  it("says one grade or the range", () => {
    expect(gradeFilterLabel(range)).toBe("6B+ to 7A");
    expect(gradeFilterLabel({ ...range, to: "6B+" })).toBe("6B+");
  });
});

describe("climbLog", () => {
  const climbs = [climb({}), ramp, brad, roof];

  it("pins open projects, then groups the rest newest first by month", () => {
    const vm = climbLog(climbs, sessions, all, NOW);
    expect(vm.groups.map((g) => [g.label, g.rows.map((r) => r.name)])).toEqual([
      [null, ["The Ramp"]],
      ["October", ["Pocket Rocket"]],
      ["September", ["Brad Pit"]],
      ["December 2025", ["Ben's Roof"]],
    ]);
  });

  it("says how each one went", () => {
    const rows = climbLog(climbs, sessions, all, NOW).groups.flatMap((g) => g.rows);
    expect(rows.map((r) => [r.pill.label, r.meta])).toEqual([
      ["Project", "Burbage North · 3 days, 11 tries"],
      ["Flash", "Stanage Popular · today"],
      ["3 tries", "Stanage Plantation · 4 Sep"],
      ["Sent", "Stanage Popular · 2 days"],
    ]);
  });

  it("counts each status inside the search and picks one", () => {
    const vm = climbLog(climbs, sessions, { ...all, query: "stanage", status: "sent" }, NOW);
    expect(vm.counts).toEqual({ all: 3, projects: 0, sent: 2, notYet: 1 });
    expect(vm.groups.flatMap((g) => g.rows).map((r) => r.name)).toEqual([
      "Pocket Rocket",
      "Ben's Roof",
    ]);
  });
});
