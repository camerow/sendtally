import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import {
  climbGradeBins,
  climbLog,
  climbingSessionVM,
  gradeFilterLabel,
  gradeFilterOf,
  gradeRangeOf,
  inGradeRange,
  matchesClimbSearch,
} from "./log";

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

describe("climbGradeBins", () => {
  it("counts the scale's own discipline from lowest to highest grade, gaps included", () => {
    const bins = climbGradeBins([climb({}), brad, roof, ramp], "font");
    expect(bins.map((b) => [b.label, b.count])).toEqual([
      ["6B+", 1],
      ["6C", 1],
      ["6C+", 0],
      ["7A", 1],
    ]);
  });

  it("turns a picked range of bins back into a grade filter and out again", () => {
    const [low, , , top] = climbGradeBins([climb({}), brad, roof], "font");
    const range = { lo: low?.rank ?? -1, hi: top?.rank ?? -1 };
    const filter = gradeFilterOf("font", range);
    expect(filter).toEqual({ scale: "font", from: "6B+", to: "7A" });
    expect(gradeRangeOf({ ...filter, from: "7A", to: "6B+" })).toEqual(range);
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

  it("puts each climb of a named session under it once, with how it went that day", () => {
    const day = {
      source: "manual",
      name: "Tuesday night session",
      start_at: "2026-10-18T10:00:00.000Z",
      climbs: [
        { name: "The Ramp", kind: "attempt", tries: 4 },
        { name: "Pocket Rocket", kind: "send", style: "flash", tries: 1 },
        { name: "The Ramp", kind: "attempt", tries: 2 },
      ],
    } as unknown as SessionWithClimbs;
    const vm = climbingSessionVM(day, climbs);
    expect(vm.named).toBe(true);
    expect(vm.climbs.map((r) => [r.name, r.pill.label, r.meta])).toEqual([
      ["The Ramp", "Project", "Burbage North · 6 tries"],
      ["Pocket Rocket", "Flash", "Stanage Popular · 1 try"],
    ]);
  });

  it("reads a bare session of climbs added on their own as those climbs, on its day", () => {
    const bare = {
      source: "manual",
      name: "",
      start_at: "2026-09-04T10:00:00.000Z",
      climbs: [{ name: "Brad Pit", kind: "attempt", tries: 3 }],
    } as unknown as SessionWithClimbs;
    const vm = climbingSessionVM(bare, climbs);
    expect(vm.named).toBe(false);
    expect(vm.climbs.map((r) => r.meta)).toEqual(["Stanage Plantation · 4 Sep"]);
    expect(climbingSessionVM({ ...bare, climbs: [] }, climbs).named).toBe(true);
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
