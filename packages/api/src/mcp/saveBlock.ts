import { BUILT_IN_WORKOUTS } from "@sendtally/core/hang";
import { z } from "zod";
import { exerciseNameKey } from "../lib/exercises";
import { blockBody, blockOf, MAX_BLOCK_WEEKS, scheduleBody } from "../lib/plan";
import * as repo from "../lib/repo";
import { retryKey } from "./saveExercise";
import type { ConnectorTool } from "./types";

const inputSchema = {
  key: retryKey,
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
  description: `Plans a training block in one call: the block, the workouts in it and the weekdays each runs on. block: name, start (YYYY-MM-DD, any weekday; null saves an unscheduled template), weeks (1-${MAX_BLOCK_WEEKS}), focus optional. Block week 1 is the 7 days from start, week 2 the next 7, and so on. Each entry of workouts names a workout from get_training_library (the user's own or a built-in, by name; save new ones with save_workout first) and its weekdays, 0 Monday to 6 Sunday, e.g. [0, 3] for Monday and Thursday. weeks optionally changes those weekdays from a later block week on, e.g. [{fromWeek: 4, weekdays: [0, 2, 4]}]. Nothing is saved if a workout name is unknown.`,
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ key, block, workouts }, { env, userId }) => {
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
    const blockId = key ?? crypto.randomUUID();
    await repo.ensureUser(env.DB, userId);
    const saved = blockOf(await repo.saveBlock(env.DB, userId, { id: blockId, ...block }));
    const start = saved.start ?? new Date().toISOString().slice(0, 10);
    for (const [position, { workoutId, weekdays, weeks }] of planned.entries()) {
      const id = `${blockId}-${position}`;
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
    return {
      block: { name: saved.name, start: saved.start, weeks: saved.weeks, focus: saved.focus },
      workouts: planned.map(({ workout, weekdays, weeks }) => ({ workout, weekdays, weeks })),
    };
  },
};
