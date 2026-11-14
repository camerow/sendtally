import { BUILT_IN_WORKOUTS } from "@sendtally/core/hang";
import { z } from "zod";
import { exerciseNameKey } from "../lib/exercises";
import { blockBody, blockOf, MAX_BLOCK_WEEKS, scheduleBody } from "../lib/plan";
import * as repo from "../lib/repo";
import { editId, owned, retryKey } from "./saveExercise";
import type { ConnectorTool } from "./types";

const inputSchema = {
  key: retryKey,
  id: editId("block"),
  block: blockBody,
  workouts: z
    .array(
      scheduleBody.extend({
        workout: z.string().trim().min(1),
        weeks: scheduleBody.shape.weeks.default([]),
      })
    )
    .min(1)
    .max(20),
};

export const saveBlock: ConnectorTool<typeof inputSchema> = {
  name: "save_block",
  title: "Save training block",
  description: `Plans a training block in one call: the block, the workouts in it and the weekdays each runs on. block: name, start (YYYY-MM-DD, any weekday), weeks (1-${MAX_BLOCK_WEEKS}), focus optional. A block with a start is dated: it is on the user's calendar from that day. start null saves an unscheduled template instead, a reusable plan with no dates that the user schedules from the app. To schedule a template you saved, or to change any block, pass its id from get_plan with the full new block and workouts rather than saving a second block of the same name; workouts it already has keep their skipped days and week changes, and one left out leaves the block. Block week 1 is the 7 days from start, week 2 the next 7, and so on. Each entry of workouts names a workout from get_training_library (the user's own or a built-in, by name; save new ones with save_workout first) and its weekdays, 0 Monday to 6 Sunday, e.g. [0, 3] for Monday and Thursday. weeks optionally changes those weekdays from a later block week on, e.g. [{fromWeek: 4, weekdays: [0, 2, 4]}]. Nothing is saved if a workout name is unknown.`,
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ key, id: editing, block, workouts }, { env, userId }) => {
    if (editing !== undefined)
      owned(await repo.getBlock(env.DB, userId, editing), "block", editing);
    const mine = await repo.listWorkouts(env.DB, userId);
    const named = [...mine, ...BUILT_IN_WORKOUTS];
    const planned = workouts.map((w) => {
      const found = named.find((n) => exerciseNameKey(n.name) === exerciseNameKey(w.workout));
      if (found === undefined) {
        throw new Error(
          `No workout named "${w.workout}". Use a name from get_training_library, or save it with save_workout first.`
        );
      }
      return { ...w, workoutId: found.id };
    });
    const blockId = editing ?? key ?? crypto.randomUUID();
    await repo.ensureUser(env.DB, userId);
    const saved = blockOf(await repo.saveBlock(env.DB, userId, { id: blockId, ...block }));
    const start = saved.start ?? new Date().toISOString().slice(0, 10);
    // A workout already in the block keeps its membership, so a retry or an edit saves it in place.
    const unclaimed = (await repo.planRows(env.DB, userId)).memberships.filter(
      (m) => m.block_id === blockId
    );
    const claim = (workoutId: string): string | undefined => {
      const at = unclaimed.findIndex((m) => m.workout_id === workoutId);
      return at === -1 ? undefined : unclaimed.splice(at, 1)[0]?.id;
    };
    for (const [position, { workoutId, weekdays, weeks }] of planned.entries()) {
      const id = claim(workoutId) ?? crypto.randomUUID();
      await repo.saveMembership(env.DB, userId, {
        id,
        workoutId,
        blockId,
        weekdays,
        start,
        position,
      });
      const days = weeks.map((w) => ({ membershipId: id, ...w }));
      await repo.saveSchedule(env.DB, userId, id, weekdays, days);
    }
    for (const m of unclaimed) await repo.deleteMembership(env.DB, userId, m.id);
    return {
      block: {
        id: saved.id,
        name: saved.name,
        start: saved.start,
        weeks: saved.weeks,
        focus: saved.focus,
      },
      workouts: planned.map(({ workout, weekdays, weeks }) => ({ workout, weekdays, weeks })),
    };
  },
};
