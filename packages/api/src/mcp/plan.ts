import { claimedMoves, weekStart } from "@sendtally/core/hang";
import * as repo from "../lib/repo";
import {
  blockOf,
  loggedSessionsOf,
  membershipDaysOf,
  membershipOf,
  planChangeOf,
  weekChangeOf,
} from "../lib/plan";
import type { ConnectorTool } from "./types";

const inputSchema = {};

export const plan: ConnectorTool<typeof inputSchema> = {
  name: "get_plan",
  title: "Get training plan",
  description:
    "The user's training plan: each block (id, name, start date, length in weeks) with the workouts scheduled in it on which weekdays, any week-by-week changes to those workouts, and workouts scheduled outside a block. A block with a start is dated, on the user's calendar from that day; start null is an unscheduled template, a reusable plan with no dates, so its workouts are not days the user trains. A dated block and a template can share a name; tell them apart by id and start. Each scheduled workout carries its own id and its workoutId from get_training_library; a built-in workout appears by its id. Also lists planned days the user skipped or moved, and, as moved with byLog true, a planned workout done on another day of its week, which the app shows done on the day it was done. Call this before proposing a new block so it fits around what is already planned, and for the ids save_block and delete_block take.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async (_args, { env, userId }) => {
    const [rows, workouts, library] = await Promise.all([
      repo.planRows(env.DB, userId),
      repo.listWorkouts(env.DB, userId),
      repo.library(env.DB, env.MEDIA_URL),
    ]);
    const workoutName = new Map(workouts.map((w) => [w.id, w.name]));
    const kinds = new Map([
      ...library.workouts.map((w) => [w.id, w.spec.kind] as const),
      ...workouts.map((w) => [w.id, w.kind] as const),
    ]);
    const blocks = rows.blocks.map(blockOf);
    const memberships = rows.memberships.map(membershipOf);
    const membershipDays = rows.membershipDays.map(membershipDaysOf);
    const weekChanges = rows.weekChanges.map(weekChangeOf);
    const handMade = rows.planChanges.map(planChangeOf);
    // A log claims within its week, so nothing logged before the week the plan starts can.
    const starts = [
      ...memberships.map((m) => m.start),
      ...blocks.flatMap((b) => (b.start === null ? [] : [b.start])),
    ].sort();
    const logs =
      starts[0] === undefined
        ? { climbs: [], hangs: [], activities: [] }
        : await repo.planLogRows(env.DB, userId, weekStart(starts[0]));
    const byLog = claimedMoves(
      { blocks, memberships, membershipDays, planChanges: handMade },
      (id) => kinds.get(id),
      loggedSessionsOf(logs)
    );
    const planChanges = [
      ...handMade.map((c) => ({ ...c, byLog: undefined })),
      ...byLog.map((c) => ({ ...c, byLog: true as const })),
    ];
    const scheduled = memberships.map((m) => ({
      id: m.id,
      blockId: m.blockId,
      workoutId: m.workoutId,
      workout: workoutName.get(m.workoutId) ?? m.workoutId,
      start: m.start,
      weekdays: m.weekdays,
      weekdaysFromWeek: membershipDays
        .filter((d) => d.membershipId === m.id)
        .map(({ fromWeek, weekdays }) => ({ fromWeek, weekdays })),
      weekChanges: weekChanges
        .filter((c) => c.membershipId === m.id)
        .map(({ week, dose, change }) => ({ week, dose, change })),
      skippedOrMoved: planChanges
        .filter((c) => c.membershipId === m.id)
        .map(({ plannedOn, kind, movedTo, reason, byLog: claimed }) => ({
          plannedOn,
          kind,
          movedTo,
          reason,
          byLog: claimed,
        })),
    }));
    const workoutsIn = (blockId: string | null): unknown[] =>
      scheduled.filter((s) => s.blockId === blockId).map(({ blockId: _, ...s }) => s);
    return {
      blocks: blocks.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description || undefined,
        start: b.start,
        weeks: b.weeks,
        workouts: workoutsIn(b.id),
      })),
      outsideBlocks: workoutsIn(null),
    };
  },
};
