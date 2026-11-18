import { describe, expect, it } from "vitest";
import type { Activity as Logged, HangHistoryRow, SessionWithClimbs } from "@sendtally/api-client";
import { isLockedRange, shownRange } from "../trends/types";
import { hangSessionSeconds } from "@sendtally/core/hang";
import { durationLabel } from "../sessions/duration";
import { doneOf, trainingInsightsVM } from "./insights";
import { TRAINED_KINDS } from "./overview";

const NOW = new Date("2026-10-22T20:00:00");

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
    focus: null,
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
    focus: null,
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
  focus: null,
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
    hangParts: [],
    activities: [lift("2026-10-10", 100), lift("2026-10-19", 110)],
  };

  it("counts only what falls in the range, a day per point over 7D", () => {
    const vm = trainingInsightsVM(log, "7d", TRAINED_KINDS, grip, NOW);
    expect(vm.sessions).toBe(5);
    expect(vm.points).toHaveLength(7);
    expect(vm.points.at(-1)?.sessions).toBe(1);
    expect(vm.points.at(-1)?.effort).toBe(8);
  });

  it("leaves an unscored session out of the effort but in the count", () => {
    const vm = trainingInsightsVM(log, "7d", TRAINED_KINDS, grip, NOW);
    expect(vm.line).toBe("Effort 6.8, up 0.8 · 5 sessions a week");
  });

  it("splits what was trained by minutes, each kind's bar its share of the time (Will, 2026-11-17)", () => {
    const vm = trainingInsightsVM(log, "1m", TRAINED_KINDS, grip, NOW);
    expect(vm.trained.map((k) => [k.kind, k.share])).toEqual([
      ["climbing", 270 / 392],
      ["hangboard", 42 / 392],
      ["strength", 80 / 392],
    ]);
    expect(vm.trained[2]?.detail).toBe("2 · 1h 20m");
  });

  it("splits it by focus too, in season order with General for none last", () => {
    const focused = {
      ...log,
      hangSessions: [{ ...hang("2026-10-16", 6), focus: "power_endurance" as const }],
      activities: [{ ...lift("2026-10-19", 110), focus: "strength" as const }],
    };
    const vm = trainingInsightsVM(focused, "1m", TRAINED_KINDS, grip, NOW);
    expect(vm.byFocus.map((f) => [f.focus, f.name, f.share])).toEqual([
      ["strength", "Strength", 40 / 331],
      ["power_endurance", "Power endurance", 21 / 331],
      [null, "General", 270 / 331],
    ]);
  });

  it("groups exercises by kind with their change on their own metric", () => {
    const vm = trainingInsightsVM(log, "1m", TRAINED_KINDS, grip, NOW);
    expect(vm.exercises.map((g) => g.kind)).toEqual(["hangboard", "strength"]);
    expect(vm.exercises[0]?.rows[0]).toMatchObject({
      name: "Half crimp",
      count: 2,
      change: 4,
      meta: "20\u00A0mm · 7s · 2 times",
    });
    expect(vm.exercises[1]?.rows[0]).toMatchObject({
      name: "Back squat",
      metric: "load",
      values: [100, 110],
      change: 10,
    });
  });

  it("trends a grip on its most used setup, completed loads only", () => {
    const vm = trainingInsightsVM(
      {
        ...log,
        hangSessions: [
          hang("2026-10-10", 7, 2),
          { ...hang("2026-10-12", 7, 20), edgeMm: 15 },
          { ...hang("2026-10-14", 7, 9), pct: 60 },
          hang("2026-10-16", 7, 5),
        ],
      },
      "1m",
      TRAINED_KINDS,
      grip,
      NOW
    );
    expect(vm.exercises[0]?.rows[0]).toMatchObject({
      count: 4,
      values: [2, 5],
      change: 3,
      meta: "20\u00A0mm · 7s · 4 times",
    });
  });

  it("draws Load from the same kinds as the rest of the tab", () => {
    const climbingOnly = trainingInsightsVM(log, "1m", ["climbing"], grip, NOW).load;
    const everything = trainingInsightsVM(log, "1m", TRAINED_KINDS, grip, NOW).load;
    const total = (bars: { value: number }[]): number => bars.reduce((n, b) => n + b.value, 0);
    expect(total(climbingOnly.bars)).toBe(7 * 90 + 5 * 90);
    expect(climbingOnly.headline).toBe("360");
    expect(climbingOnly.leftOutLine?.replace(/\u00a0/g, " ")).toBe(
      "1 not counted in this range: no effort"
    );
    expect(climbingOnly.bars.map((b) => b.readout.split(" · ")[1])).toEqual([
      "0 sessions",
      "1 session",
      "0 sessions",
      "2 sessions",
    ]);
    expect(total(everything.bars)).toBeGreaterThan(total(climbingOnly.bars));
  });

  it("shows climbing alone with training off", () => {
    const vm = trainingInsightsVM(log, "1m", ["climbing"], grip, NOW);
    expect(vm.sessions).toBe(3);
    expect(vm.exercises).toEqual([]);
  });
});

describe("a workout's fingerboard part", () => {
  const run: Logged = { ...lift("2026-10-20", 100), minutes: 60, rpe: 7, workoutId: "w1" };
  const part = { ...hang("2026-10-20", 7, 10), id: "p1", workoutId: "w1", activityId: run.id };
  const fingers = Math.round(hangSessionSeconds(part) / 60);
  const log = { sessions: [], hangSessions: [], hangParts: [part], activities: [run] };

  it("counts once, as its run, with the run's whole minutes and effort for the workload", () => {
    expect(doneOf(log)).toEqual([
      expect.objectContaining({
        ref: expect.objectContaining({ id: run.id }),
        minutes: 60,
        rpe: 7,
        fingers,
      }),
    ]);
    const vm = trainingInsightsVM(log, "7d", TRAINED_KINDS, grip, NOW);
    expect(vm.sessions).toBe(1);
    expect(vm.workload.acute).toBe(
      trainingInsightsVM({ ...log, hangParts: [] }, "7d", TRAINED_KINDS, grip, NOW).workload.acute
    );
  });

  it("plots the workload over its own window, whatever the range", () => {
    const vm = (weeks: 4 | 8 | 12) =>
      trainingInsightsVM(log, "all", TRAINED_KINDS, grip, NOW, weeks).workload;
    expect(trainingInsightsVM(log, "all", TRAINED_KINDS, grip, NOW).workload).toEqual(vm(4));
    expect(vm(12).sheet).toEqual(vm(4).sheet);
    expect(vm(12).from).not.toBe(vm(4).from);
  });

  const kindSessions = (vm: ReturnType<typeof trainingInsightsVM>): number =>
    vm.trained.reduce(
      (n, k) =>
        n +
        (k.detail.includes(" · ")
          ? Number(k.detail.split(" · ")[0])
          : /^\d+$/.test(k.detail)
            ? Number(k.detail)
            : 0),
      0
    );

  it("moves only its minutes to Fingers: the run is one session under its own kind", () => {
    const vm = trainingInsightsVM(log, "7d", TRAINED_KINDS, grip, NOW);
    expect(vm.trained.map((k) => [k.kind, k.detail])).toEqual([
      ["hangboard", durationLabel(fingers)],
      ["strength", `1 · ${durationLabel(60 - fingers)}`],
    ]);
    expect(kindSessions(vm)).toBe(vm.sessions);
    expect(vm.total).toContain(durationLabel(60));
  });

  it("gives a part that fills the run all of its minutes, and the run's kind its session", () => {
    const short = { ...log, activities: [{ ...run, minutes: fingers }] };
    const vm = trainingInsightsVM(short, "7d", TRAINED_KINDS, grip, NOW);
    expect(vm.trained.map((k) => [k.kind, k.detail])).toEqual([
      ["hangboard", durationLabel(fingers)],
      ["strength", "1"],
    ]);
    expect(kindSessions(vm)).toBe(vm.sessions);
    expect(vm.total).toContain(durationLabel(fingers));
  });

  it("counts a Fingers run with a part once, with its whole minutes", () => {
    const fingersRun = { ...run, kind: "hangboard" } as unknown as Logged;
    const vm = trainingInsightsVM(
      { ...log, activities: [fingersRun] },
      "7d",
      TRAINED_KINDS,
      grip,
      NOW
    );
    expect(vm.trained.map((k) => [k.kind, k.detail])).toEqual([
      ["hangboard", `1 · ${durationLabel(60)}`],
    ]);
  });

  it("adds its grips to the grip trends", () => {
    const vm = trainingInsightsVM(log, "7d", TRAINED_KINDS, grip, NOW);
    expect(
      vm.exercises.find((g) => g.kind === "hangboard")?.rows.map((r) => [r.key, r.count])
    ).toEqual([["half", 1]]);
  });

  it("trends a part's second grip, from the dose it ran", () => {
    const pinch = {
      item: 1,
      exercise: "pinch",
      dose: { sets: 2, reps: 5, onS: 10, edgeMm: 20 },
      sets: [
        { reps: 5, onS: 10, edgeMm: 20, weightKg: 6 },
        { reps: 5, onS: 10, edgeMm: 20, weightKg: 6 },
      ],
    };
    const twoGrips = { ...part, done: [pinch] };
    const vm = trainingInsightsVM(
      { ...log, hangParts: [twoGrips] },
      "7d",
      TRAINED_KINDS,
      grip,
      NOW
    );
    expect(
      vm.exercises.find((g) => g.kind === "hangboard")?.rows.map((r) => [r.key, r.count, r.values])
    ).toEqual([
      ["half", 1, [10]],
      ["pinch", 1, [6]],
    ]);
  });
});

describe("a standalone session of several grips", () => {
  it("trends every grip it ran, each on its own setup", () => {
    const open = {
      item: 1,
      exercise: "open",
      dose: { sets: 1, reps: 3, onS: 7, edgeMm: 15 },
      sets: [{ reps: 2, onS: 7, edgeMm: 15, weightKg: 0 }],
    };
    const session = { ...hang("2026-10-20", 7, 4), done: [open] };
    const vm = trainingInsightsVM(
      { sessions: [], hangSessions: [session], hangParts: [], activities: [] },
      "7d",
      TRAINED_KINDS,
      grip,
      NOW
    );
    const rows = vm.exercises.find((g) => g.kind === "hangboard")?.rows ?? [];
    expect(rows.map((r) => [r.key, r.count])).toEqual([
      ["half", 1],
      ["open", 1],
    ]);
    expect(rows.find((r) => r.key === "open")?.values).toEqual([]);
  });
});
