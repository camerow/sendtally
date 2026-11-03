import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import { gradeFormatter } from "../sessions/grades";
import { avgSendLabel, climbingInsightsVM, mainDiscipline, workoutClimbSessions } from "./insights";

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
  const all = { range: "7d", discipline: "boulder", place: "all", boulderScale: "v" } as const;

  it("counts a named climb once across sessions, sent when any of them sent it", () => {
    const vm = climbingInsightsVM(sessions, [], all, NOW);
    expect(vm.pyramid).toEqual([
      { gradeLabel: "V7", inner: 1, outer: 0, countLabel: "1/1" },
      { gradeLabel: "V6", inner: 1, outer: 0, countLabel: "1/1" },
      { gradeLabel: "V5", inner: 0, outer: 1, countLabel: "0/1" },
      { gradeLabel: "V4", inner: 1, outer: 0, countLabel: "1/1" },
    ]);
    expect([vm.avgSend, vm.sends, vm.flashed]).toEqual(["V5", 3, 1]);
    expect(vm.hardest).toEqual({ gradeLabel: "V7", name: "the pinch", dateLabel: "Oct 26" });
  });

  it("keeps to the gym with the Gym filter, so the hardest is the top gym send", () => {
    const vm = climbingInsightsVM(sessions, [], { ...all, place: "indoor" }, NOW);
    expect(vm.hardest).toEqual({ gradeLabel: "V6", name: null, dateLabel: "Oct 26" });
    expect(vm.avgSend).toBe("V6");
  });

  it("reads the average send in Font for a climber who grades in Font", () => {
    const vm = climbingInsightsVM(sessions, [], { ...all, boulderScale: "font" }, NOW);
    expect(vm.avgSend).toBe("6C");
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

  it("counts the climbs a workout logged on its tally, inside at the gym", () => {
    const workout = workoutClimbSessions([
      {
        id: "a1",
        date: "2026-10-26",
        startTime: "19:00",
        done: [
          {
            item: 0,
            exercise: "4x4s",
            sets: [
              {
                climbs: [
                  { grade: "V8", scale: "v", tries: 1, sent: true, style: "flash" },
                  { grade: "V5", scale: "v", tries: 2, sent: false },
                ],
              },
            ],
          },
          { item: 1, exercise: "Core", sets: [{ reps: 10 }] },
        ],
      },
      { id: "a2", date: "2026-10-26", startTime: null, done: [] },
    ]);
    expect(workout.map((s) => [s.fingerprint, s.location, s.climbs.length])).toEqual([
      ["a1", "indoor", 2],
    ]);
    const vm = climbingInsightsVM([...sessions, ...workout], [], all, NOW);
    expect([vm.sends, vm.flashed]).toEqual([4, 2]);
    expect(vm.hardest?.gradeLabel).toBe("V8");
    expect(vm.pyramid.find((r) => r.gradeLabel === "V5")).toMatchObject({ inner: 0, outer: 2 });
  });
});

describe("climbs by grade", () => {
  const all = { range: "7d", discipline: "boulder", place: "all", boulderScale: "v" } as const;
  const pinch = {
    id: "c-pinch",
    name: "The Pinch",
    project: false,
    area: { id: "a1", name: "Bishop" },
  } as ClimbSummary;

  it("groups the climbs tried hardest grade first, counted the same as the pyramid", () => {
    const vm = climbingInsightsVM(sessions, [pinch], all, NOW);
    expect(vm.byGrade.map((g) => [g.gradeLabel, g.split])).toEqual([
      ["V7", "1 sent"],
      ["V6", "1 sent"],
      ["V5", "1 attempted"],
      ["V4", "1 sent"],
    ]);
  });

  it("reads a named climb across its days and opens it", () => {
    const vm = climbingInsightsVM(sessions, [pinch], all, NOW);
    expect(vm.byGrade[0]?.climbs).toEqual([
      {
        key: "the pinch",
        target: { kind: "climb", id: "c-pinch" },
        row: {
          id: "c-pinch",
          gradeLabel: "V7",
          name: "The Pinch",
          meta: "Bishop · 2 days",
          pill: { kind: "sent", label: "Sent" },
        },
      },
    ]);
  });

  it("puts a session's unnamed climbs at a grade on one row that opens the session", () => {
    const gym = session("2026-10-27T09:00:00.000Z", "indoor", [
      go(5, "attempt", { tries: 2 }),
      go(5, "attempt", { tries: 3 }),
      go(5, "attempt"),
    ]);
    const withGym = { ...gym, gym_id: "g1" };
    const vm = climbingInsightsVM(
      [...sessions, withGym],
      [],
      { ...all, gyms: new Map([["g1", "Mission Cliffs"]]) },
      NOW
    );
    const v5 = vm.byGrade.find((g) => g.gradeLabel === "V5");
    expect(v5?.split).toBe("4 attempted");
    expect(v5?.climbs).toEqual([
      {
        key: "2026-10-27T09:00:00.000Z:5",
        target: { kind: "session", id: "2026-10-27T09:00:00.000Z" },
        row: {
          id: "2026-10-27T09:00:00.000Z",
          gradeLabel: "V5",
          name: "Gym climbs",
          count: 3,
          meta: "Mission Cliffs · Oct 27",
          pill: { kind: "tries", label: "6 tries" },
        },
      },
      expect.objectContaining({ row: expect.objectContaining({ count: 1, meta: "Oct 26" }) }),
    ]);
  });

  it("reads a group as sent when any of it went, and opens a workout's tally climbs on the workout", () => {
    const tally = workoutClimbSessions([
      {
        id: "a1",
        date: "2026-10-27",
        startTime: "19:00",
        done: [
          {
            item: 0,
            exercise: "Limit boulders",
            sets: [
              {
                climbs: [
                  { grade: "V6", scale: "v", tries: 2, sent: false },
                  { grade: "V6", scale: "v", tries: 1, sent: true },
                ],
              },
            ],
          },
        ],
      },
    ]);
    const vm = climbingInsightsVM([...sessions, ...tally], [], all, NOW);
    const v6 = vm.byGrade.find((g) => g.gradeLabel === "V6");
    expect(v6?.split).toBe("2 sent · 1 attempted");
    expect(v6?.climbs[0]).toMatchObject({
      target: { kind: "activity", id: "a1" },
      row: { name: "Gym climbs", count: 2, pill: { kind: "sent", label: "Sent" } },
    });
  });

  it("lists named climbs and grouped ones together, newest first", () => {
    const day = session("2026-10-27T09:00:00.000Z", "outdoor", [
      go(5, "send", { name: "Blue arete" }),
      go(5, "attempt", { name: "Red roof", tries: 3 }),
    ]);
    const vm = climbingInsightsVM([...sessions, day], [], all, NOW);
    const v5 = vm.byGrade.find((g) => g.gradeLabel === "V5");
    expect(v5?.split).toBe("1 sent · 2 attempted");
    expect(v5?.climbs.map((c) => c.row.name)).toEqual(["Blue arete", "Red roof", "Gym climbs"]);
    expect(v5?.climbs[1]?.row.pill.label).toBe("3 tries");
  });

  it("shows a climb flagged as a project and not yet sent as a project", () => {
    const day = session("2026-10-27T09:00:00.000Z", "outdoor", [
      go(8, "attempt", { name: "Roof" }),
    ]);
    const roof = { ...pinch, id: "c-roof", name: "Roof", project: true, area: null };
    const vm = climbingInsightsVM([...sessions, day], [roof], all, NOW);
    expect(vm.byGrade[0]?.climbs[0]?.row).toMatchObject({
      meta: "Oct 27",
      pill: { kind: "project", label: "Project" },
    });
  });

  it("follows the place filter", () => {
    const vm = climbingInsightsVM(sessions, [], { ...all, place: "indoor" }, NOW);
    expect(vm.byGrade.map((g) => g.gradeLabel)).toEqual(["V6", "V5"]);
  });
});

describe("avgSendLabel", () => {
  const boulder = gradeFormatter("boulder", "yds");

  it("rounds the mean of the sends down to a grade", () => {
    expect(avgSendLabel([4, 6, 7], boulder, "v")).toBe("V5");
    expect(avgSendLabel([3, 4], boulder, "v")).toBe("V3");
  });

  it("reads boulders in Font when the climber does", () => {
    expect(avgSendLabel([4, 6, 7], boulder, "font")).toBe("6C");
  });

  it("reads routes in the scale they were logged in, whatever the boulder scale", () => {
    expect(avgSendLabel([10, 11], gradeFormatter("route", "french"), "font")).toBe("6c");
    expect(avgSendLabel([10, 11], gradeFormatter("route", "yds"), "v")).toBe("5.11b");
  });

  it("has nothing to say without a send", () => {
    expect(avgSendLabel([], boulder, "v")).toBeNull();
  });
});
