import * as repo from "../lib/repo";
import { blockOf, membershipDaysOf, membershipOf, planChangeOf, weekChangeOf } from "../lib/plan";
import type { ConnectorTool } from "./types";

const inputSchema = {};

export const plan: ConnectorTool<typeof inputSchema> = {
  name: "get_plan",
  title: "Get training plan",
  description:
    "The user's training plan: each block (name, start date, length in weeks) with the workouts scheduled in it on which weekdays, any week-by-week changes to those workouts, and workouts scheduled outside a block. A workout from the built-in library appears by its id. Also lists planned days the user skipped or moved. Call this before proposing a new block so it fits around what is already planned.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async (_args, { env, userId }) => {
    const [rows, workouts] = await Promise.all([
      repo.planRows(env.DB, userId),
      repo.listWorkouts(env.DB, userId),
    ]);
    const workoutName = new Map(workouts.map((w) => [w.id, w.name]));
    const scheduled = rows.memberships.map(membershipOf).map((m) => ({
      blockId: m.blockId,
      workout: workoutName.get(m.workoutId) ?? m.workoutId,
      start: m.start,
      weekdays: m.weekdays,
      weekdaysFromWeek: rows.membershipDays
        .map(membershipDaysOf)
        .filter((d) => d.membershipId === m.id)
        .map(({ fromWeek, weekdays }) => ({ fromWeek, weekdays })),
      weekChanges: rows.weekChanges
        .map(weekChangeOf)
        .filter((c) => c.membershipId === m.id)
        .map(({ week, dose, change }) => ({ week, dose, change })),
      skippedOrMoved: rows.planChanges
        .map(planChangeOf)
        .filter((c) => c.membershipId === m.id)
        .map(({ plannedOn, kind, movedTo, reason }) => ({ plannedOn, kind, movedTo, reason })),
    }));
    const workoutsIn = (blockId: string | null): unknown[] =>
      scheduled.filter((s) => s.blockId === blockId).map(({ blockId: _, ...s }) => s);
    return {
      blocks: rows.blocks.map(blockOf).map((b) => ({
        name: b.name,
        start: b.start,
        weeks: b.weeks,
        workouts: workoutsIn(b.id),
      })),
      outsideBlocks: workoutsIn(null),
    };
  },
};
