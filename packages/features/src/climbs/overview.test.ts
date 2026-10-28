import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { climbDetailVM } from "./overview";
import { sessionPyramid } from "./pyramid";

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
  it("lists every session newest first, matching by id or by name", () => {
    const vm = climbDetailVM(climb({}), [
      session("2026-09-26T18:00:00.000Z", "outdoor", [
        go(7, "attempt", { name: "the pinch", tries: 6, note: "First look." }),
      ]),
      session("2026-10-24T18:00:00.000Z", "outdoor", [
        go(7, "attempt", { name: "Renamed", userClimbId: "c1", tries: 8 }),
        go(7, "attempt", { name: "The Pinch", userClimbId: "other", tries: 1 }),
      ]),
    ]);
    expect(vm.kicker).toBe("Boulder · V7");
    expect(vm.meta).toBe("Buttermilks · first tried 26 Sep");
    expect([vm.project, vm.days, vm.tries, vm.best]).toEqual([true, "3", "23", "-"]);
    expect(vm.sessions.map((v) => [v.dateLabel, v.meta, v.triesLabel, v.note])).toEqual([
      ["24 Oct", "Buttermilks · Not yet", "8 tries", null],
      ["26 Sep", "Buttermilks · Not yet", "6 tries", "First look."],
    ]);
  });

  it("names the best as how the first send went", () => {
    const sent = climb({ sent_at: "2026-10-24T18:00:00.000Z" });
    const vm = climbDetailVM(sent, [
      session("2026-10-24T18:00:00.000Z", "outdoor", [
        go(7, "send", { name: "The Pinch", style: "flash" }),
      ]),
    ]);
    expect(vm.best).toBe("Flash");
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
