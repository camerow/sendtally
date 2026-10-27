import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { climbDetailVM, climbsOverview } from "./overview";
import { sessionPyramid } from "./pyramid";
import { climbLogDraft } from "./useClimbs";

const NOW = new Date("2026-10-27T12:00:00.000Z");

const go = (
  v: number,
  kind: "send" | "attempt",
  over: Partial<SessionClimb> = {}
): SessionClimb => ({
  time: "2026-10-01T18:00:00.000Z",
  name: "",
  vGrade: v,
  kind,
  tries: 1,
  angle: null,
  note: null,
  link: null,
  grade: { scale: "v", value: v },
  ...over,
});

const session = (
  start_at: string,
  location: "indoor" | "outdoor",
  climbs: SessionClimb[]
): SessionWithClimbs =>
  ({ fingerprint: start_at, start_at, location, climbs }) as unknown as SessionWithClimbs;

const climb = (over: Partial<ClimbSummary>): ClimbSummary => ({
  id: "c1",
  slug: "the-pinch",
  name: "The Pinch",
  grade: { scale: "v", value: 7 },
  discipline: "boulder",
  project: true,
  area_climb_id: null,
  area: { id: "a1", name: "Buttermilks" },
  sessions: 3,
  attempts: 23,
  sends: 0,
  first_at: "2026-09-26T18:00:00.000Z",
  last_at: "2026-10-24T18:00:00.000Z",
  sent_at: null,
  ...over,
});

describe("climbsOverview", () => {
  const sessions = [
    session("2026-10-24T10:00:00.000Z", "outdoor", [go(7, "send"), go(5, "send")]),
    session("2026-10-24T15:00:00.000Z", "outdoor", [go(5, "send")]),
    session("2025-06-01T10:00:00.000Z", "outdoor", [go(5, "send"), go(4, "attempt")]),
    session("2026-10-20T18:00:00.000Z", "indoor", [go(9, "send")]),
  ];

  it("counts days outside, the hardest outdoor send and the pyramid", () => {
    const vm = climbsOverview([], sessions, "boulder", true, NOW);
    expect([vm.daysOutside, vm.daysOutsideLastYear]).toEqual([1, 1]);
    expect(vm.hardest).toEqual({ gradeLabel: "V7", dateLabel: "24 Oct" });
    expect(vm.disciplines).toEqual(["boulder"]);
    expect(vm.pyramid).toEqual([
      { gradeLabel: "V7", inner: 1, outer: 0, countLabel: "1" },
      { gradeLabel: "V5", inner: 2, outer: 1, countLabel: "3" },
    ]);
  });

  it("shows only this year without the member history", () => {
    expect(climbsOverview([], sessions, "boulder", false, NOW).pyramid).toEqual([
      { gradeLabel: "V7", inner: 1, outer: 0, countLabel: "1" },
      { gradeLabel: "V5", inner: 2, outer: 0, countLabel: "2" },
    ]);
  });

  it("lists working climbs, then sent ones", () => {
    const vm = climbsOverview(
      [
        climb({}),
        climb({ id: "c2", name: "Roof", sends: 1, sent_at: "2026-09-12T18:00:00.000Z" }),
        climb({ id: "c3", name: "Idle", project: false }),
      ],
      [],
      "boulder",
      true,
      NOW
    );
    expect(vm.working).toEqual([
      { id: "c1", gradeLabel: "V7", name: "The Pinch", meta: "Buttermilks · 3 days · 23 tries" },
    ]);
    expect(vm.sent.map((r) => [r.id, r.meta])).toEqual([["c2", "Buttermilks · Sent 12 Sep"]]);
  });
});

describe("climbDetailVM", () => {
  it("lists every visit newest first, matching by id or by name", () => {
    const vm = climbDetailVM(climb({}), [
      session("2026-09-26T18:00:00.000Z", "outdoor", [
        go(7, "attempt", { name: "the pinch", tries: 6, note: "First look." }),
      ]),
      session("2026-10-24T18:00:00.000Z", "outdoor", [
        go(7, "attempt", { name: "Renamed", userClimbId: "c1", tries: 8 }),
        go(7, "attempt", { name: "The Pinch", userClimbId: "other", tries: 1 }),
      ]),
    ]);
    expect(vm.eyebrow).toBe("Boulder · Buttermilks");
    expect(vm.status).toBe("Working · 3 days · 23 tries");
    expect(vm.visits.map((v) => [v.month, v.dayOfMonth, v.triesLabel, v.note])).toEqual([
      ["Oct", "24", "8 tries", null],
      ["Sep", "26", "6 tries", "First look."],
    ]);
  });
});

describe("sessionPyramid", () => {
  it("puts sends in the middle and not-yet either side, hardest first", () => {
    expect(sessionPyramid([go(4, "send"), go(5, "attempt"), go(5, "send"), go(4, "send")])).toEqual(
      [
        { gradeLabel: "V5", inner: 1, outer: 1, countLabel: "1/2" },
        { gradeLabel: "V4", inner: 2, outer: 0, countLabel: "2/2" },
      ]
    );
  });
});

describe("climbLogDraft", () => {
  it("is a flash on one try sent, a redpoint on more, and keeps its links", () => {
    const base = {
      name: " The Pinch ",
      scale: "v",
      grade: "V7",
      note: "",
      areaClimbId: "ac1",
    } as const;
    expect(climbLogDraft({ ...base, sent: true, tries: 1 })).toMatchObject({
      name: "The Pinch",
      kind: "send",
      style: "flash",
      tries: 1,
      climbId: "ac1",
    });
    expect(climbLogDraft({ ...base, sent: true, tries: 4 })).toMatchObject({ style: "redpoint" });
    expect(climbLogDraft({ ...base, sent: false, tries: 6 })).toMatchObject({
      kind: "attempt",
      tries: 6,
    });
  });
});
