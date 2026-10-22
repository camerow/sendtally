import { describe, expect, it } from "vitest";
import type { Activity, HangSessionRecord, PlanItem } from "@sendtally/api-client";
import { LIBRARY, type Schedule } from "@sendtally/core/hang";
import type { TrainingLog } from "./days";
import { reminderMoment, trainingReminders, type ReminderNames } from "./reminders";

const TODAY = "2026-10-05";
const MORNING = new Date(2026, 9, 5, 6, 0);

const schedule: Schedule = {
  id: "s1",
  workoutId: "rep73",
  gripId: "half",
  days: [0, 2],
  start: "2026-09-28",
  end: null,
  skip: ["2026-10-07"],
};

const plan: PlanItem = {
  id: "p1",
  kind: "strength",
  title: "Gym, legs",
  days: [0, 3],
  perWeek: null,
  start: "2026-09-28",
  end: null,
  skip: [],
  minutes: 60,
  targetRpe: null,
  projectId: null,
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
  protocol: LIBRARY[0]!,
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
  planItemId: null,
  detail: null,
});

const log = (overrides: Partial<TrainingLog> = {}): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities: [],
  schedules: [schedule],
  planItems: [plan],
  ...overrides,
});

const names: ReminderNames = {
  workout: (id) => (id === "rep73" ? { ...LIBRARY[0]!, name: "Repeaters" } : undefined),
  gripName: (id) => (id === "half" ? "Half crimp" : id),
};

const remind = (l: TrainingLog, now = MORNING, days = 10): { date: string; body: string }[] =>
  trainingReminders(l, names, TODAY, "08:00", now, days).map(({ date, body }) => ({ date, body }));

describe("trainingReminders", () => {
  it("lists hangboard and plan items on each day with something planned", () => {
    expect(remind(log())).toEqual([
      { date: "2026-10-05", body: "Repeaters · Half crimp, Gym, legs" },
      { date: "2026-10-08", body: "Gym, legs" },
      { date: "2026-10-12", body: "Repeaters · Half crimp, Gym, legs" },
      { date: "2026-10-14", body: "Repeaters · Half crimp" },
    ]);
  });

  it("drops skipped dates", () => {
    expect(remind(log()).map((r) => r.date)).not.toContain("2026-10-07");
    const skipped = log({ planItems: [{ ...plan, skip: ["2026-10-08"] }] });
    expect(remind(skipped).map((r) => r.date)).not.toContain("2026-10-08");
  });

  it("leaves out what is already done, and a day once all of it is", () => {
    expect(remind(log({ hangs: [hang(TODAY)] }))[0]).toEqual({
      date: TODAY,
      body: "Gym, legs",
    });
    const done = log({ hangs: [hang(TODAY)], activities: [activity(TODAY)] });
    expect(remind(done)[0]?.date).toBe("2026-10-08");
  });

  it("skips today once the reminder time has passed", () => {
    expect(remind(log(), new Date(2026, 9, 5, 9, 0))[0]?.date).toBe("2026-10-08");
  });

  it("never reminds about a weekly goal", () => {
    const goal = log({ schedules: [], planItems: [{ ...plan, days: [], perWeek: 3 }] });
    expect(remind(goal)).toEqual([]);
  });

  it("fires at the chosen local time", () => {
    const at = reminderMoment("2026-10-07", "07:30");
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual(
      [2026, 9, 7, 7, 30]
    );
  });
});
