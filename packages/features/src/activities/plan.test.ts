import type { Activity, PlanItem } from "@sendtally/api-client";
import { describe, expect, it } from "vitest";
import { planOccurrences, trainingLoad } from "./plan";

const item = (over: Partial<PlanItem> = {}): PlanItem => ({
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
  ...over,
});

const logged = (over: Partial<Activity> = {}): Activity => ({
  id: "a1",
  kind: "mobility",
  title: "Stretch",
  date: "2026-09-29",
  startTime: null,
  minutes: 20,
  rpe: null,
  notes: null,
  planItemId: null,
  detail: null,
  ...over,
});

// Mon 28 Sep 2026 to Sun 11 Oct 2026, today Thu 1 Oct.
const range = { start: "2026-09-28", end: "2026-10-12" };
const today = "2026-10-01";

const days = (items: PlanItem[], activities: Activity[] = [], climbs: string[] = []): string[][] =>
  planOccurrences(items, activities, climbs, range, today).days.map((o) => [o.date, o.status]);

describe("planOccurrences", () => {
  it("lands a weekday item on its days inside start, end and skip", () => {
    const occurrences = days([
      item({ start: "2026-09-30", end: "2026-10-08", skip: ["2026-10-06"] }),
    ]);
    expect(occurrences).toEqual([["2026-10-01", "planned"]]);
  });

  it("is done by an activity linked to it, or of the same kind, on that day", () => {
    const occurrences = days(
      [item(), item({ id: "p2", kind: "run", days: [3] })],
      [
        logged({ date: "2026-09-29", kind: "yoga", planItemId: "p1" }),
        logged({ id: "a2", date: "2026-10-01", kind: "run" }),
        logged({ id: "a3", date: "2026-10-01", kind: "mobility" }),
      ]
    );
    expect(occurrences.slice(0, 3)).toEqual([
      ["2026-09-29", "done"],
      ["2026-10-01", "planned"],
      ["2026-10-01", "done"],
    ]);
  });

  it("misses a past day nothing fulfilled, and keeps today planned", () => {
    expect(days([item({ days: [0, 3] })]).slice(0, 2)).toEqual([
      ["2026-09-28", "missed"],
      ["2026-10-01", "planned"],
    ]);
  });

  it("counts any climbing session for a climb, and never an activity's kind", () => {
    const climb = item({ kind: "climb", days: [0, 2] });
    expect(
      days([climb], [logged({ date: "2026-09-28", kind: "other" })], ["2026-09-30"]).slice(0, 2)
    ).toEqual([
      ["2026-09-28", "missed"],
      ["2026-09-30", "done"],
    ]);
  });

  it("tracks a weekly goal by the days that fulfilled it", () => {
    const goal = item({ days: [], perWeek: 2, kind: "run", start: "2026-09-30" });
    const { days: dated, weeks } = planOccurrences(
      [goal],
      [
        logged({ date: "2026-09-27", kind: "run" }),
        logged({ id: "a2", date: "2026-09-30", kind: "run" }),
        logged({ id: "a3", date: "2026-09-30", kind: "run" }),
        logged({ id: "a4", date: "2026-10-05", kind: "run" }),
        logged({ id: "a5", date: "2026-10-06", kind: "run" }),
      ],
      [],
      { start: "2026-09-21", end: "2026-10-19" },
      "2026-10-13"
    );
    expect(dated).toEqual([]);
    expect(weeks.map((w) => [w.week, w.done, w.target, w.status])).toEqual([
      ["2026-09-28", 1, 2, "missed"],
      ["2026-10-05", 2, 2, "done"],
      ["2026-10-12", 0, 2, "planned"],
    ]);
  });
});

describe("trainingLoad", () => {
  it("is minutes times RPE, and unknown without an RPE", () => {
    expect(trainingLoad({ minutes: 50, rpe: 7 })).toBe(350);
    expect(trainingLoad({ minutes: 50, rpe: null })).toBeNull();
  });
});
