import { describe, expect, it } from "vitest";
import type { Activity as Logged, HangHistoryRow, SessionWithClimbs } from "@sendtally/api-client";
import { isLockedRange, shownRange } from "../trends/types";
import { trainingInsightsVM } from "./insights";
import { ACTIVITY_KINDS } from "./overview";

const NOW = new Date("2026-10-22T20:00:00Z");

function climbing(
  start: string,
  rpe: number,
  extra: Partial<SessionWithClimbs> = {}
): SessionWithClimbs {
  return {
    fingerprint: `fp-${start}`,
    board: null,
    source: "manual",
    location: "indoor",
    gym_id: null,
    area_id: null,
    name: null,
    start_at: start,
    end_at: new Date(Date.parse(start) + 90 * 60_000).toISOString(),
    times: "both",
    climb_count: 0,
    send_count: 0,
    top_grade: 0,
    top_send_grade: 0,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe,
    rpe_source: "user",
    title: "",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    membership_id: null,
    week: null,
    tags: [],
    climbs: [],
    ...extra,
  };
}

function hang(date: string, rpe: number | null, loadKg = 4): HangHistoryRow {
  return {
    id: `h-${date}`,
    workoutId: "rep73",
    gripId: "half",
    gripName: null,
    date,
    loadKg,
    pct: 100,
    misses: 0,
    rpe,
    edgeMm: 20,
    protocol: {
      name: "Repeaters 7:3",
      kind: "hang",
      hangS: 7,
      restS: 3,
      reps: 6,
      sets: 6,
      setRestS: 180,
    },
    stravaActivityId: null,
    membershipId: null,
    week: null,
    done: [],
    postState: null,
    postError: null,
    updatedAt: `${date}T19:00:00.000Z`,
  };
}

const lift = (date: string, weightKg: number): Logged => ({
  id: `lift-${date}`,
  kind: "strength",
  title: "Lift",
  date,
  startTime: null,
  minutes: 40,
  rpe: 6,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  done: [{ item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg }] }],
});

const grip = (): string => "Half crimp";

describe("the free range gate", () => {
  it("locks every range but 7D until membership is known to be on", () => {
    expect(isLockedRange(false, "7d")).toBe(false);
    expect(isLockedRange(false, "1m")).toBe(true);
    expect(isLockedRange(null, "all")).toBe(true);
    expect(isLockedRange(true, "all")).toBe(false);
  });

  it("draws 7D for a free picker whatever was picked", () => {
    expect(shownRange(false, "1y")).toBe("7d");
    expect(shownRange(null, "3m")).toBe("7d");
    expect(shownRange(true, "1y")).toBe("1y");
  });
});

describe("trainingInsightsVM", () => {
  const log = {
    sessions: [
      climbing("2026-10-20T18:00:00Z", 7),
      climbing("2026-10-21T18:00:00Z", 6, { rpe_source: "none" }),
      climbing("2026-10-08T18:00:00Z", 5),
    ],
    hangSessions: [hang("2026-10-16", 6, 2), hang("2026-10-22", 8, 6)],
    activities: [lift("2026-10-10", 100), lift("2026-10-19", 110)],
  };

  it("counts only what falls in the range, a day per point over 7D", () => {
    const vm = trainingInsightsVM(log, "7d", ACTIVITY_KINDS, grip, NOW);
    expect(vm.sessions).toBe(5);
    expect(vm.points).toHaveLength(7);
    expect(vm.points.at(-1)?.sessions).toBe(1);
    expect(vm.points.at(-1)?.effort).toBe(8);
  });

  it("leaves an unscored session out of the effort but in the count", () => {
    const vm = trainingInsightsVM(log, "7d", ACTIVITY_KINDS, grip, NOW);
    expect(vm.line).toBe("Effort 6.8, up 0.8 · 5.0 sessions a week");
  });

  it("splits what was trained by sessions, with each kind's time", () => {
    const vm = trainingInsightsVM(log, "1m", ACTIVITY_KINDS, grip, NOW);
    expect(vm.trained.map((k) => [k.kind, k.share])).toEqual([
      ["climbing", 3 / 7],
      ["hangboard", 2 / 7],
      ["strength", 2 / 7],
    ]);
    expect(vm.trained[2]?.detail).toBe("2 · 1h 20m");
  });

  it("groups exercises by kind with their change on their own metric", () => {
    const vm = trainingInsightsVM(log, "1m", ACTIVITY_KINDS, grip, NOW);
    expect(vm.exercises.map((g) => g.kind)).toEqual(["hangboard", "strength"]);
    expect(vm.exercises[0]?.rows[0]).toMatchObject({ name: "Half crimp", count: 2, change: 4 });
    expect(vm.exercises[1]?.rows[0]).toMatchObject({
      name: "Back squat",
      metric: "load",
      values: [100, 110],
      change: 10,
    });
  });

  it("shows climbing alone with training off", () => {
    const vm = trainingInsightsVM(log, "1m", ["climbing"], grip, NOW);
    expect(vm.sessions).toBe(3);
    expect(vm.exercises).toEqual([]);
  });
});
