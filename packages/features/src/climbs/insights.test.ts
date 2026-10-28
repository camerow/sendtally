import { describe, expect, it } from "vitest";
import type { SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { climbingInsightsVM, mainDiscipline } from "./insights";

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
  style: "redpoint",
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

const sessions = [
  session("2026-10-25T10:00:00.000Z", "outdoor", [
    go(7, "attempt", { name: "The Pinch" }),
    go(4, "send", { style: "flash" }),
  ]),
  session("2026-10-26T10:00:00.000Z", "outdoor", [go(7, "send", { name: "the pinch " })]),
  session("2026-10-26T18:00:00.000Z", "indoor", [go(5, "attempt"), go(6, "send")]),
  session("2026-08-01T10:00:00.000Z", "outdoor", [go(9, "send")]),
];

describe("climbingInsightsVM", () => {
  const all = { range: "7d", discipline: "boulder", place: "all" } as const;

  it("counts a named climb once across sessions, sent when any of them sent it", () => {
    const vm = climbingInsightsVM(sessions, [], all, NOW);
    expect(vm.pyramid).toEqual([
      { gradeLabel: "V7", inner: 1, outer: 0, countLabel: "1/1" },
      { gradeLabel: "V6", inner: 1, outer: 0, countLabel: "1/1" },
      { gradeLabel: "V5", inner: 0, outer: 1, countLabel: "0/1" },
      { gradeLabel: "V4", inner: 1, outer: 0, countLabel: "1/1" },
    ]);
    expect([vm.daysOutside, vm.sends, vm.flashed]).toEqual([2, 3, 1]);
    expect(vm.hardest).toEqual({ gradeLabel: "V7", name: "the pinch", dateLabel: "26 Oct" });
  });

  it("keeps to the gym with the Gym filter, so the hardest is the top gym send", () => {
    const vm = climbingInsightsVM(sessions, [], { ...all, place: "indoor" }, NOW);
    expect(vm.hardest).toEqual({ gradeLabel: "V6", name: null, dateLabel: "26 Oct" });
    expect(vm.daysOutside).toBe(2);
  });

  it("reaches back as far as the range does", () => {
    const vm = climbingInsightsVM(sessions, [], { ...all, range: "6m" }, NOW);
    expect(vm.hardest?.gradeLabel).toBe("V9");
  });

  it("reads routes in their own discipline", () => {
    expect(mainDiscipline(sessions)).toBe("boulder");
    const vm = climbingInsightsVM(sessions, [], { ...all, discipline: "route" }, NOW);
    expect([vm.sends, vm.pyramid, vm.hardest]).toEqual([0, [], null]);
  });
});
