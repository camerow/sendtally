import { describe, expect, it } from "vitest";
import type { Activity, HangSessionRecord, Plan, SessionRow } from "@sendtally/api-client";
import type { Protocol, Workout } from "@sendtally/core/hang";
import { dayMarks, trainingDay, trainingWeek, weekDone, type TrainingLog } from "./days";

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
    send_count: 0,
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
    membership_id: null,
    week: null,
    focus: null,
    tags: [],
    ...overrides,
  };
}

const protocol: Protocol = {
  name: "Repeaters",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 6,
  setRestS: 180,
};

function hang(date: string, overrides: Partial<HangSessionRecord> = {}): HangSessionRecord {
  return {
    id: `h-${date}`,
    workoutId: "rep73",
    gripId: "half",
    date,
    loadKg: 4,
    pct: 100,
    misses: 0,
    rpe: 6,
    edgeMm: 20,
    protocol,
    membershipId: null,
    week: null,
    focus: null,
    done: [],
    stravaActivityId: null,
    postState: null,
    postError: null,
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

const activity = (date: string, overrides: Partial<Activity> = {}): Activity => ({
  id: `a-${date}`,
  kind: "strength",
  title: "Gym",
  date,
  startTime: null,
  minutes: 50,
  rpe: null,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  ...overrides,
});

const workouts: Workout[] = [
  {
    id: "rep73",
    kind: "hangboard",
    name: "Repeaters",
    description: "",
    minutes: null,
    targetRpe: null,
    items: [{ exercise: "half", doses: [{ sets: 6, reps: 6, onS: 7 }] }],
    exerciseRestS: 180,
    focus: null,
  },
  {
    id: "legs",
    kind: "strength",
    name: "Gym, legs",
    description: "",
    minutes: 60,
    targetRpe: null,
    items: [],
    exerciseRestS: 180,
    focus: null,
  },
  {
    id: "limit",
    kind: "climbing",
    name: "Limit boulders",
    description: "",
    minutes: 90,
    targetRpe: null,
    items: [],
    exerciseRestS: 180,
    focus: null,
  },
];

// Hangboard Mondays and Thursdays, legs Tuesdays and Thursdays, limit Wednesdays.
const plan: Plan = {
  blocks: [],
  memberships: [
    { id: "h1", workoutId: "rep73", blockId: null, weekdays: [0, 3], start: "2026-09-28" },
    { id: "p1", workoutId: "legs", blockId: null, weekdays: [1, 3], start: "2026-09-28" },
    { id: "c1", workoutId: "limit", blockId: null, weekdays: [2], start: "2026-09-28" },
  ],
  weekChanges: [],
};

const log = (overrides: Partial<TrainingLog> = {}): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities: [],
  plan,
  workout: (id) => workouts.find((w) => w.id === id),
  ...overrides,
});

const nothingPlanned: Plan = { blocks: [], memberships: [], weekChanges: [] };

describe("trainingDay", () => {
  it("dates a climbing session by its wall-clock start", () => {
    const day = trainingDay(
      log({ climbs: [climb("2026-09-30T23:30:00.000Z")] }),
      "2026-09-30",
      TODAY
    );
    expect(day.logged.map((i) => i.kind)).toEqual(["climb"]);
  });

  it("marks a plan done by a session logged against it", () => {
    const day = trainingDay(
      log({ hangs: [hang("2026-09-28", { membershipId: "h1" })] }),
      "2026-09-28",
      TODAY
    );
    expect(day.logged.map((i) => i.kind)).toEqual(["hang"]);
    expect(day.plans.map((p) => [p.membership.id, p.status])).toEqual([["h1", "done"]]);
  });

  it("keeps today's plans open until something is logged", () => {
    const day = trainingDay(log(), TODAY, TODAY);
    expect(day.isToday).toBe(true);
    expect(day.plans.map((p) => [p.membership.id, p.status])).toEqual([
      ["h1", "planned"],
      ["p1", "planned"],
    ]);
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
    expect(week.map((d) => d.plans.length)).toEqual([1, 1, 1, 2, 0, 0, 0]);
  });
});

describe("weekDone", () => {
  const done = (l: TrainingLog): { done: number; planned: number } =>
    weekDone(trainingWeek(l, "2026-09-28", TODAY));

  it("counts logged against logged plus open", () => {
    const stats = done(
      log({
        climbs: [
          climb("2026-09-30T18:00:00.000Z"),
          climb("2026-09-29T18:00:00.000Z", { rpe_source: "none", rpe: 1 }),
          climb("2026-09-22T18:00:00.000Z"),
        ],
        hangs: [hang("2026-09-28", { rpe: 7, membershipId: "h1" })],
      })
    );
    // Logged: two climbs and a hang. Open: legs Tuesday (missed), hangs and legs Thursday.
    expect(stats).toEqual({ done: 3, planned: 6 });
  });

  it("counts other training toward the week", () => {
    const stats = done(
      log({
        plan: nothingPlanned,
        activities: [activity("2026-09-29", { rpe: 5 }), activity("2026-09-21")],
      })
    );
    expect(stats).toEqual({ done: 1, planned: 1 });
  });

  it("is nothing of nothing on an empty week", () => {
    expect(done(log({ plan: nothingPlanned }))).toEqual({ done: 0, planned: 0 });
  });
});

describe("plans on a day", () => {
  const busy = log({
    climbs: [climb("2026-09-30T18:00:00.000Z")],
    activities: [activity("2026-09-29"), activity("2026-09-28", { kind: "mobility" })],
  });

  it("lists each day's memberships with their status", () => {
    const week = trainingWeek(busy, "2026-09-28", TODAY);
    expect(week.map((d) => d.plans.map((p) => `${p.membership.id}:${p.status}`))).toEqual([
      ["h1:missed"],
      ["p1:done"],
      ["c1:done"],
      ["h1:planned", "p1:planned"],
      [],
      [],
      [],
    ]);
  });

  it("fills a mark for what happened, once for a logged session, not again for the plan it did", () => {
    const [monday, tuesday, wednesday, thursday] = trainingWeek(busy, "2026-09-28", TODAY);
    expect(dayMarks(monday!)).toEqual([
      { kind: "mobility", filled: true },
      { kind: "hangboard", filled: false },
    ]);
    expect(dayMarks(tuesday!)).toEqual([{ kind: "strength", filled: true }]);
    expect(dayMarks(wednesday!)).toEqual([{ kind: "climbing", filled: true }]);
    expect(dayMarks(thursday!)).toEqual([
      { kind: "hangboard", filled: false },
      { kind: "strength", filled: false },
    ]);
  });
});
