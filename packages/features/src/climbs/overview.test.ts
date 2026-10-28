import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { climbDetailVM } from "./overview";
import { sessionPyramid } from "./pyramid";
import { climbLogDraft } from "./useClimbs";

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
