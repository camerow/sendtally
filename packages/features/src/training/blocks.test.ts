import { describe, expect, it } from "vitest";
import type { Activity, HangSessionRecord, PlanItem, SessionRow } from "@sendtally/api-client";
import { LIBRARY, totalSeconds, type Schedule, type TrainingBlock } from "@sendtally/core/hang";
import { blockMembers, blockWeeks } from "./blocks";
import type { TrainingLog } from "./days";

const block: TrainingBlock = {
  id: "b1",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 3,
  loads: [{ load: 100 }, { load: 120, phase: "test" }, { load: 50, phase: "deload" }],
  notes: null,
  endedOn: null,
};

const item: PlanItem = {
  id: "p1",
  kind: "strength",
  title: "Gym",
  days: [0, 3],
  perWeek: null,
  start: "2026-09-28",
  end: "2026-10-19",
  skip: ["2026-10-08"],
  minutes: 60,
  targetRpe: 7,
  projectId: null,
  template: null,
  blockId: "b1",
};

const weekly: PlanItem = { ...item, id: "p2", days: [], perWeek: 2, minutes: 30, targetRpe: 5 };

const schedule: Schedule = {
  id: "s1",
  workoutId: "w1",
  gripId: "half",
  days: [2],
  start: "2026-09-28",
  end: "2026-10-19",
  skip: [],
  targetRpe: 8,
  blockId: "b1",
};

const protocol = LIBRARY[0]!;

const activity = (date: string, minutes: number, rpe: number | null): Activity => ({
  id: `a-${date}`,
  kind: "strength",
  title: "Gym",
  date,
  startTime: null,
  minutes,
  rpe,
  notes: null,
  planItemId: null,
  detail: null,
});

const hang = (date: string, rpe: number): HangSessionRecord => ({
  id: `h-${date}`,
  workoutId: "w1",
  gripId: "half",
  date,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe,
  protocol,
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "2026-10-01T00:00:00Z",
});

const climb = (start_at: string, end_at: string, rpe_source = "computed"): SessionRow =>
  ({
    fingerprint: `manual-${start_at}`,
    start_at,
    end_at,
    times: "both",
    rpe: 6,
    rpe_source,
  }) as SessionRow;

const log = (over: Partial<TrainingLog>): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities: [],
  schedules: [],
  planItems: [],
  ...over,
});

const members = blockMembers(
  block,
  [item, weekly, { ...item, id: "p3", blockId: null }],
  [schedule, { ...schedule, id: "s2", blockId: "b2" }]
);

describe("blockWeeks", () => {
  it("takes only the block's own members", () => {
    expect(members.items.map((i) => i.id)).toEqual(["p1", "p2"]);
    expect(members.schedules.map((s) => s.id)).toEqual(["s1"]);
  });

  it("plans minutes times target effort for each occurrence scaled by the week's load", () => {
    const weeks = blockWeeks(block, members, log({}), () => 20, "2026-10-01");
    const gym = 60 * 7;
    const goal = 2 * 30 * 5;
    const hangboard = 20 * 8;
    expect(weeks.map((w) => [w.week, w.phase, w.load, w.planned, w.ahead])).toEqual([
      [1, null, 100, 2 * gym + goal + hangboard, false],
      [2, "test", 120, (gym + goal + hangboard) * 1.2, true],
      [3, "deload", 50, (2 * gym + goal + hangboard) / 2, true],
    ]);
  });

  it("leaves out a member without minutes or a target, and an unknown workout", () => {
    const bare = blockMembers(block, [{ ...item, targetRpe: null }], [schedule]);
    expect(blockWeeks(block, bare, log({}), () => null, "2026-10-01")[0]?.planned).toBe(0);
  });

  it("counts everything logged in the week as actual, without an effort or a score", () => {
    const weeks = blockWeeks(
      block,
      members,
      log({
        activities: [activity("2026-09-28", 50, 8), activity("2026-09-29", 30, null)],
        hangs: [hang("2026-09-30", 9)],
        climbs: [
          climb("2026-10-01T18:00:00Z", "2026-10-01T20:00:00Z"),
          climb("2026-10-02T18:00:00Z", "2026-10-02T20:00:00Z", "none"),
          climb("2026-10-05T18:00:00Z", "2026-10-05T19:00:00Z"),
        ],
      }),
      () => 20,
      "2026-10-05"
    );
    expect(weeks.map((w) => w.actual)).toEqual([
      Math.round(50 * 8 + (totalSeconds(protocol) / 60) * 9 + 120 * 6),
      60 * 6,
      0,
    ]);
  });

  it("stops at the week a block was ended in", () => {
    const ended = { ...block, endedOn: "2026-10-08" };
    const weeks = blockWeeks(ended, members, log({}), () => 20, "2026-10-01");
    expect(weeks.map((w) => [w.week, w.planned])).toEqual([
      [1, 2 * 420 + 300 + 160],
      [2, (420 + 300 + 160) * 1.2],
    ]);
  });
});
