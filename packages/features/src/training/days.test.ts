import { describe, expect, it } from "vitest";
import type { Activity, HangSessionRecord, PlanItem, SessionRow } from "@sendtally/api-client";
import { LIBRARY, type Schedule } from "@sendtally/core/hang";
import { dayMarks, trainingDay, trainingWeek, weekStats, type TrainingLog } from "./days";

const TODAY = "2026-10-01";

function climb(start_at: string, overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    fingerprint: `manual-${start_at}`,
    board: null,
    source: "manual",
    location: null,
    gym_id: null,
    area_id: null,
    name: null,
    start_at,
    end_at: start_at,
    times: "both",
    climb_count: 10,
    top_grade: 6,
    top_send_grade: 6,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 8,
    rpe_source: "computed",
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags: [],
    ...overrides,
  };
}

const protocol = LIBRARY[0]!;

function hang(date: string, overrides: Partial<HangSessionRecord> = {}): HangSessionRecord {
  return {
    id: `h-${date}`,
    workoutId: "w1",
    gripId: "half-crimp",
    date,
    loadKg: 4,
    pct: 100,
    misses: 0,
    rpe: 6,
    protocol,
    stravaActivityId: null,
    postState: null,
    postError: null,
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

const schedule: Schedule = {
  id: "s1",
  workoutId: "w1",
  gripId: "half-crimp",
  days: [0, 3, 4],
  start: "2026-09-28",
  end: null,
  skip: ["2026-10-02"],
};

const log = (overrides: Partial<TrainingLog> = {}): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities: [],
  schedules: [schedule],
  planItems: [],
  ...overrides,
});

const plan = (overrides: Partial<PlanItem> = {}): PlanItem => ({
  id: "p1",
  kind: "strength",
  title: "Gym, legs",
  days: [1, 3],
  perWeek: null,
  start: "2026-09-28",
  end: null,
  skip: [],
  minutes: 60,
  targetRpe: null,
  projectId: null,
  ...overrides,
});

const activity = (date: string, overrides: Partial<Activity> = {}): Activity => ({
  id: `a-${date}`,
  kind: "strength",
  title: "Gym",
  date,
  startTime: null,
  minutes: 50,
  rpe: null,
  notes: null,
  planItemId: null,
  detail: null,
  ...overrides,
});

describe("trainingDay", () => {
  it("dates a climbing session by its wall-clock start", () => {
    const day = trainingDay(
      log({ climbs: [climb("2026-09-30T23:30:00.000Z")] }),
      "2026-09-30",
      TODAY
    );
    expect(day.logged.map((i) => i.kind)).toEqual(["climb"]);
  });

  it("drops a planned workout once that workout and grip is logged that day", () => {
    const day = trainingDay(log({ hangs: [hang("2026-09-28")] }), "2026-09-28", TODAY);
    expect(day.logged.map((i) => i.kind)).toEqual(["hang"]);
    expect(day.planned).toEqual([]);
  });

  it("keeps a workout planned when a different grip was logged", () => {
    const day = trainingDay(log({ hangs: [hang(TODAY, { gripId: "open-hand" })] }), TODAY, TODAY);
    expect(day.logged).toHaveLength(1);
    expect(day.planned.map((i) => i.schedule.id)).toEqual(["s1"]);
    expect(day.isToday).toBe(true);
  });

  it("leaves a skipped date empty", () => {
    expect(trainingDay(log(), "2026-10-02", TODAY).planned).toEqual([]);
  });
});

describe("trainingWeek", () => {
  it("runs Monday to Sunday and marks the past", () => {
    const week = trainingWeek(log(), "2026-09-28", TODAY);
    expect(week.map((d) => d.date)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(week.map((d) => d.isPast)).toEqual([true, true, true, false, false, false, false]);
    expect(week.map((d) => d.planned.length)).toEqual([1, 0, 0, 1, 0, 0, 0]);
  });
});

describe("weekStats", () => {
  it("counts logged against logged plus open, averages scored effort and counts the streak", () => {
    const stats = weekStats(
      log({
        climbs: [
          climb("2026-09-30T18:00:00.000Z"),
          climb("2026-09-29T18:00:00.000Z", { rpe_source: "none", rpe: 1 }),
          climb("2026-09-22T18:00:00.000Z"),
        ],
        hangs: [hang("2026-09-28", { rpe: 7 })],
      }),
      TODAY
    );
    expect(stats).toEqual({ done: 3, planned: 4, effort: 7.5, streak: 2 });
  });

  it("counts other training toward the week, its effort and the streak", () => {
    const activity = (date: string, rpe: number | null): Activity => ({
      id: `a-${date}`,
      kind: "strength",
      title: "Gym",
      date,
      startTime: null,
      minutes: 50,
      rpe,
      notes: null,
      planItemId: null,
      detail: null,
    });
    const stats = weekStats(
      log({ schedules: [], activities: [activity("2026-09-29", 5), activity("2026-09-21", null)] }),
      TODAY
    );
    expect(stats).toEqual({ done: 1, planned: 1, effort: 5, streak: 2 });
  });

  it("has no effort without a scored session", () => {
    expect(weekStats(log({ schedules: [] }), TODAY)).toEqual({
      done: 0,
      planned: 0,
      effort: null,
      streak: 0,
    });
  });
});

describe("plan items on a day", () => {
  const plans = log({
    schedules: [],
    planItems: [
      plan(),
      plan({ id: "c1", kind: "climb", title: "Limit boulders", days: [2] }),
      plan({ id: "g1", kind: "mobility", days: [], perWeek: 3 }),
    ],
    climbs: [climb("2026-09-30T18:00:00.000Z")],
    activities: [activity("2026-09-29"), activity("2026-09-28", { kind: "mobility" })],
  });

  it("lists a day's occurrences with their status and the week's goals", () => {
    const week = trainingWeek(plans, "2026-09-28", TODAY);
    expect(week.map((d) => d.plans.map((p) => `${p.plan.id}:${p.status}`))).toEqual([
      [],
      ["p1:done"],
      ["c1:done"],
      ["p1:planned"],
      [],
      [],
      [],
    ]);
    expect(week[0]?.goals.map((g) => [g.item.id, g.done, g.target])).toEqual([["g1", 1, 3]]);
  });

  it("fills a mark for what happened, once for a logged session or activity, not again for the plan it did", () => {
    const [, tuesday, wednesday, thursday] = trainingWeek(plans, "2026-09-28", TODAY);
    expect(dayMarks(tuesday!)).toEqual([{ kind: "strength", filled: true }]);
    expect(dayMarks(wednesday!)).toEqual([{ kind: "climb", filled: true }]);
    expect(dayMarks(thursday!)).toEqual([{ kind: "strength", filled: false }]);
  });

  it("counts plan days and weekly goals in the week's stats", () => {
    expect(weekStats(plans, TODAY)).toMatchObject({ done: 3, planned: 6 });
  });
});
