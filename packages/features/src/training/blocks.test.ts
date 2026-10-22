import { describe, expect, it } from "vitest";
import type { Activity, HangSessionRecord, Plan, SessionRow } from "@sendtally/api-client";
import { totalSeconds, type Block, type Protocol } from "@sendtally/core/hang";
import { blockMembers, blockWeeks } from "./blocks";

const block: Block = { id: "b1", name: "Autumn finger block", start: "2026-09-28", weeks: 3 };

const protocol: Protocol = {
  name: "Repeaters",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 6,
  setRestS: 180,
};

const activity = (date: string, minutes: number, rpe: number | null): Activity => ({
  id: `a-${date}`,
  kind: "strength",
  title: "Gym",
  date,
  startTime: null,
  minutes,
  rpe,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  variation: null,
  done: [],
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
  edgeMm: 20,
  protocol,
  membershipId: null,
  week: null,
  variation: null,
  done: [],
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

describe("blockMembers", () => {
  it("takes only the block's own memberships", () => {
    const plan: Plan = {
      blocks: [block],
      memberships: [
        { id: "m1", workoutId: "w1", blockId: "b1", weekdays: [0], start: block.start },
        { id: "m2", workoutId: "w1", blockId: null, weekdays: [0], start: block.start },
        { id: "m3", workoutId: "w1", blockId: "b2", weekdays: [0], start: block.start },
      ],
      weekChanges: [],
    };
    expect(blockMembers(plan, block).map((m) => m.id)).toEqual(["m1"]);
  });
});

describe("blockWeeks", () => {
  it("counts everything logged in each week, without an effort or a score", () => {
    const weeks = blockWeeks(
      block,
      {
        activities: [activity("2026-09-28", 50, 8), activity("2026-09-29", 30, null)],
        hangs: [hang("2026-09-30", 9)],
        climbs: [
          climb("2026-10-01T18:00:00Z", "2026-10-01T20:00:00Z"),
          climb("2026-10-02T18:00:00Z", "2026-10-02T20:00:00Z", "none"),
          climb("2026-10-05T18:00:00Z", "2026-10-05T19:00:00Z"),
        ],
      },
      "2026-10-05"
    );
    expect(weeks.map((w) => [w.week, w.start, w.actual, w.ahead])).toEqual([
      [1, "2026-09-28", Math.round(50 * 8 + (totalSeconds(protocol) / 60) * 9 + 120 * 6), false],
      [2, "2026-10-05", 60 * 6, false],
      [3, "2026-10-12", 0, true],
    ]);
  });
});
