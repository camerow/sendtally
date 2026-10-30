import { describe, expect, it } from "vitest";
import type { Activity, HangSessionRecord, Plan } from "@sendtally/api-client";
import type { Workout } from "@sendtally/core/hang";
import type { TrainingLog } from "./days";
import { reminderMoment, trainingReminders } from "./reminders";

const TODAY = "2026-10-05";
const MORNING = new Date(2026, 9, 5, 6, 0);

const workout = (id: string, kind: Workout["kind"], name: string): Workout => ({
  id,
  kind,
  name,
  description: "",
  minutes: null,
  targetRpe: null,
  items: [],
  exerciseRestS: 180,
  focus: null,
});

const workouts = [
  workout("rep73", "hangboard", "Repeaters"),
  workout("legs", "strength", "Gym, legs"),
];

// Repeaters Mondays and Wednesdays, legs Mondays and Thursdays.
const plan: Plan = {
  blocks: [],
  memberships: [
    { id: "s1", workoutId: "rep73", blockId: null, weekdays: [0, 2], start: "2026-09-28" },
    { id: "p1", workoutId: "legs", blockId: null, weekdays: [0, 3], start: "2026-09-28" },
  ],
  weekChanges: [],
};

const hang = (date: string): HangSessionRecord => ({
  id: `h-${date}`,
  workoutId: "rep73",
  gripId: "half",
  date,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: null,
  edgeMm: 20,
  protocol: { name: "R", kind: "hang", hangS: 7, restS: 3, reps: 6, sets: 6, setRestS: 180 },
  membershipId: "s1",
  week: null,
  focus: null,
  done: [],
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "2026-10-01T00:00:00Z",
});

const activity = (date: string): Activity => ({
  id: `a-${date}`,
  kind: "strength",
  title: "Gym",
  date,
  startTime: null,
  minutes: 50,
  rpe: null,
  notes: null,
  workoutId: "legs",
  membershipId: "p1",
  week: null,
  focus: null,
  done: [],
});

const log = (overrides: Partial<TrainingLog> = {}): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities: [],
  plan,
  workout: (id) => workouts.find((w) => w.id === id),
  ...overrides,
});

const remind = (l: TrainingLog, now = MORNING, days = 10): { date: string; body: string }[] =>
  trainingReminders(l, TODAY, "08:00", now, days).map(({ date, body }) => ({ date, body }));

describe("trainingReminders", () => {
  it("lists the workouts planned on each day with something planned", () => {
    expect(remind(log())).toEqual([
      { date: "2026-10-05", body: "Repeaters, Gym, legs" },
      { date: "2026-10-07", body: "Repeaters" },
      { date: "2026-10-08", body: "Gym, legs" },
      { date: "2026-10-12", body: "Repeaters, Gym, legs" },
      { date: "2026-10-14", body: "Repeaters" },
    ]);
  });

  it("leaves out what is already done, and a day once all of it is", () => {
    expect(remind(log({ hangs: [hang(TODAY)] }))[0]).toEqual({ date: TODAY, body: "Gym, legs" });
    const done = log({ hangs: [hang(TODAY)], activities: [activity(TODAY)] });
    expect(remind(done)[0]?.date).toBe("2026-10-07");
  });

  it("skips today once the reminder time has passed", () => {
    expect(remind(log(), new Date(2026, 9, 5, 9, 0))[0]?.date).toBe("2026-10-07");
  });

  it("reminds about a one-off on its day only", () => {
    const once = { id: "o1", workoutId: "legs", blockId: null, weekdays: [], start: "2026-10-09" };
    const l = log({ plan: { ...plan, memberships: [once] } });
    expect(remind(l)).toEqual([{ date: "2026-10-09", body: "Gym, legs" }]);
  });

  it("fires at the chosen local time", () => {
    const at = reminderMoment("2026-10-07", "07:30");
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual(
      [2026, 9, 7, 7, 30]
    );
  });
});
