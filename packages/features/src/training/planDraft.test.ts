import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import type { DatedBlock } from "@sendtally/core/hang";
import { applyDraft, changedSchedules, draftSchedule, emptyDraft, movedWith } from "./planDraft";
import { scheduleOf, toggleDay } from "./weekDays";

const block: DatedBlock = { id: "b", name: "Base", start: "2026-11-09", weeks: 4, focus: null };
const plan: Plan = {
  blocks: [block],
  memberships: [
    { id: "m1", workoutId: "w", blockId: "b", weekdays: [0], start: block.start },
    { id: "m2", workoutId: "w", blockId: "b", weekdays: [2], start: "2026-11-16" },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};
const m1 = plan.memberships[0]!;

describe("applyDraft", () => {
  it("moves the block and the plans that start with it, and nothing else", () => {
    const moved = { ...block, start: "2026-11-23" };
    expect(movedWith(plan, moved).map((m) => m.id)).toEqual(["m1"]);
    const next = applyDraft(plan, { ...emptyDraft, block: moved });
    expect(next.blocks[0]?.start).toBe("2026-11-23");
    expect(next.memberships.map((m) => m.start)).toEqual(["2026-11-23", "2026-11-16"]);
  });

  it("shows days as tapped, and saves only schedules that changed", () => {
    const tapped = toggleDay(scheduleOf(plan, m1), { week: 2, day: 4, following: false, last: 4 });
    const draft = draftSchedule(emptyDraft, tapped);
    const next = applyDraft(plan, draft);
    expect(next.membershipDays.map((d) => [d.fromWeek, d.weekdays])).toEqual([
      [2, [0, 4]],
      [3, [0]],
    ]);
    expect(changedSchedules(plan, draft)).toEqual([tapped]);
    const back = toggleDay(tapped, { week: 2, day: 4, following: false, last: 4 });
    expect(changedSchedules(plan, draftSchedule(draft, back))).toEqual([]);
  });
});
