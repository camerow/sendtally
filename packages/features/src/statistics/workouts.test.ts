import { describe, expect, it } from "vitest";
import type { Activity, HangHistoryRow } from "@sendtally/api-client";
import { TRAINED_KINDS } from "./overview";
import { pickedWorkouts, workoutsDone } from "./workouts";

const hang = (date: string, over: Partial<HangHistoryRow> = {}): HangHistoryRow => ({
  id: `h-${date}`,
  workoutId: "my-max",
  gripId: "half",
  gripName: null,
  date,
  loadKg: 4,
  pct: 100,
  misses: 0,
  rpe: 8,
  edgeMm: 20,
  protocol: {
    name: "Max hangs",
    kind: "hang",
    hangS: 10,
    restS: 170,
    reps: 1,
    sets: 6,
    setRestS: 0,
  },
  stravaActivityId: null,
  membershipId: null,
  week: null,
  focus: "power",
  done: [],
  postState: null,
  postError: null,
  updatedAt: `${date}T19:00:00.000Z`,
  ...over,
});

const activity = (date: string, over: Partial<Activity> = {}): Activity => ({
  id: `a-${date}`,
  kind: "climbing",
  title: "Limit bouldering",
  date,
  startTime: null,
  minutes: 90,
  rpe: null,
  notes: null,
  workoutId: "limit",
  membershipId: null,
  week: null,
  focus: "power",
  done: [],
  ...over,
});

const log = {
  hangSessions: [
    hang("2026-10-20"),
    hang("2026-10-25", { id: "h-last", rpe: 9 }),
    hang("2026-10-28"),
    hang("2026-11-01", { focus: null }),
    hang("2026-09-01"),
  ],
  activities: [
    activity("2026-10-22"),
    activity("2026-10-30", {
      id: "a-mine",
      workoutId: null,
      title: " Pull and core",
      kind: "strength",
      focus: "strength",
    }),
    activity("2026-10-31", {
      workoutId: null,
      title: "pull and core ",
      kind: "strength",
      focus: "strength",
    }),
  ],
};

const october = (ms: number): boolean =>
  ms >= Date.parse("2026-10-01") && ms < Date.parse("2026-11-02");

describe("workoutsDone", () => {
  const vm = workoutsDone(log, october, TRAINED_KINDS);

  it("groups by category in the mix's order, the most done first", () => {
    expect(vm.category.map((g) => [g.key, g.rows.map((r) => [r.name, r.meta])])).toEqual([
      ["climbing", [["Limit bouldering", "1 time"]]],
      ["hangboard", [["Max hangs", "4 times"]]],
      ["strength", [["pull and core", "2 times"]]],
    ]);
  });

  it("counts a workout under each focus it was done with, General last", () => {
    expect(vm.focus.map((g) => [g.key, g.label, g.rows.map((r) => [r.name, r.meta])])).toEqual([
      ["strength", "Strength", [["pull and core", "2 times"]]],
      [
        "power",
        "Power",
        [
          ["Max hangs", "3 times"],
          ["Limit bouldering", "1 time"],
        ],
      ],
      ["general", "General", [["Max hangs", "1 time"]]],
    ]);
  });

  it("keeps the last three in range, newest first, and every time for the log", () => {
    const max = vm.category[1]?.rows[0];
    expect(max?.sessions.map((s) => s.dateLabel)).toEqual([
      "Sun, Nov 1",
      "Wed, Oct 28",
      "Sun, Oct 25",
    ]);
    expect(max?.sessions[2]).toEqual({
      id: "h-last",
      dateLabel: "Sun, Oct 25",
      duration: "1m",
      rpe: "RPE 9",
    });
    expect(max?.total).toBe(5);
    expect(vm.category[0]?.rows[0]?.sessions[0]).toMatchObject({ duration: "1h 30m", rpe: null });
  });

  it("knows a workout logged without one from the library by its title", () => {
    expect(vm.category[2]?.rows[0]?.key).toBe("title:pull and core");
  });

  it("leaves out kinds the caller does not ask for", () => {
    expect(workoutsDone(log, october, ["hangboard"]).category.map((g) => g.key)).toEqual([
      "hangboard",
    ]);
  });
});

describe("pickedWorkouts", () => {
  const { focus } = workoutsDone(log, october, TRAINED_KINDS);

  it("shows every group with nothing picked", () => {
    expect(pickedWorkouts(focus, null)).toHaveLength(3);
  });

  it("narrows to the picked category or focus", () => {
    expect(pickedWorkouts(focus, "power").map((g) => g.key)).toEqual(["power"]);
    expect(pickedWorkouts(focus, "endurance")).toEqual([]);
  });
});
