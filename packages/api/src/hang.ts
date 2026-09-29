import { zValidator } from "@hono/zod-validator";
import { isBuiltInGrip } from "@sendtally/core/hang";
import { Hono } from "hono";
import { type AppEnv, invalidBody, postAfterResponse } from "./context";
import {
  builtInGripNamed,
  gripKey,
  gripOf,
  hangDefaultGripBody,
  hangGripBody,
  hangIdParam,
  hangLoadsBody,
  hangScheduleBody,
  hangSessionBody,
  hangSessionOf,
  hangSettingsBody,
  hangWorkoutBody,
  hangWorkoutParam,
  isLibraryWorkout,
  scheduleOf,
  settingsOf,
  workoutOf,
  type HangData,
} from "./lib/hang";
import { syncHangSessionToStrava } from "./lib/posting";
import * as repo from "./lib/repo";

// hangtally: hangboard and ground-pull training. The app generates every id,
// so each write is an idempotent PUT it can retry or replay offline.
export const hang = new Hono<AppEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const [rows, strava] = await Promise.all([
      repo.hangRows(c.env.DB, userId),
      repo.getStravaConnection(c.env.DB, userId),
    ]);
    const data: HangData = {
      grips: rows.grips.map(gripOf),
      workouts: rows.workouts.map(workoutOf),
      defaultGrips: Object.fromEntries(rows.defaultGrips.map((r) => [r.workout_id, r.grip_id])),
      loads: rows.loads,
      schedules: rows.schedules.map(scheduleOf),
      sessions: rows.sessions.map(hangSessionOf),
      settings: settingsOf(rows.settings),
      strava: { connected: strava?.status === "active" },
    };
    return c.json(data);
  })

  // A name another grip already has, built in or custom, in any case, answers
  // with that grip instead of making a second one.
  .put(
    "/grips/:id",
    zValidator("param", hangIdParam, invalidBody),
    zValidator("json", hangGripBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      if (isBuiltInGrip(id)) return c.json({ error: "built-in grips cannot be changed" }, 400);
      const { name } = c.req.valid("json");
      const builtIn = builtInGripNamed(name);
      if (builtIn !== null) return c.json({ grip: builtIn });
      const userId = c.get("userId");
      const nameKey = gripKey(name);
      const taken = await repo.findHangGripByKey(c.env.DB, userId, nameKey);
      if (taken !== null && taken.id !== id) return c.json({ grip: gripOf(taken) });
      await repo.ensureUser(c.env.DB, userId);
      await repo.saveHangGrip(c.env.DB, userId, { id, name, nameKey });
      return c.json({ grip: { id, name, custom: true } });
    }
  )

  .put(
    "/workouts/:id",
    zValidator("param", hangIdParam, invalidBody),
    zValidator("json", hangWorkoutBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      if (isLibraryWorkout(id)) return c.json({ error: "library workouts cannot be changed" }, 400);
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const row = await repo.saveHangWorkout(c.env.DB, userId, id, c.req.valid("json"));
      return c.json({ workout: workoutOf(row) });
    }
  )

  .put(
    "/default-grips/:workoutId",
    zValidator("param", hangWorkoutParam, invalidBody),
    zValidator("json", hangDefaultGripBody, invalidBody),
    async (c) => {
      const { workoutId } = c.req.valid("param");
      const { gripId } = c.req.valid("json");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      await repo.setHangDefaultGrip(c.env.DB, userId, workoutId, gripId);
      return c.json({ workoutId, gripId });
    }
  )

  .put("/loads", zValidator("json", hangLoadsBody, invalidBody), async (c) => {
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    return c.json({
      loads: await repo.mergeHangLoads(c.env.DB, userId, c.req.valid("json").loads),
    });
  })

  .put(
    "/schedules/:id",
    zValidator("param", hangIdParam, invalidBody),
    zValidator("json", hangScheduleBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const row = await repo.saveHangSchedule(c.env.DB, userId, { id, ...c.req.valid("json") });
      return c.json({ schedule: scheduleOf(row) });
    }
  )

  // The schedule goes; the sessions logged against it stay.
  .delete("/schedules/:id", zValidator("param", hangIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deleteHangSchedule(c.env.DB, c.get("userId"), id) });
  })

  // Creates or edits. A new session posts to Strava when the user turned that
  // on; an edit of a posted one patches its activity, never posts a second.
  .put(
    "/sessions/:id",
    zValidator("param", hangIdParam, invalidBody),
    zValidator("json", hangSessionBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const existing = await repo.getHangSession(c.env.DB, userId, id);
      const row = await repo.saveHangSession(c.env.DB, userId, { id, ...c.req.valid("json") });
      if (existing === null || existing.strava_activity_id !== null) {
        postAfterResponse(c, id, () => syncHangSessionToStrava(c.env, userId, id));
      }
      return c.json({ session: hangSessionOf(row) });
    }
  )

  // Its Strava activity, if any, stays on Strava.
  .delete("/sessions/:id", zValidator("param", hangIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deleteHangSession(c.env.DB, c.get("userId"), id) });
  })

  .post("/sessions/:id/strava", zValidator("param", hangIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("userId");
    if ((await repo.getHangSession(c.env.DB, userId, id)) === null) {
      return c.json({ error: "not found" }, 404);
    }
    const result = await syncHangSessionToStrava(c.env, userId, id, true);
    if (result.outcome === "failed") {
      return c.json({ outcome: result.outcome, reason: result.reason }, 502);
    }
    const row = await repo.getHangSession(c.env.DB, userId, id);
    if (row === null) return c.json({ error: "not found" }, 404);
    return c.json({ outcome: result.outcome, reason: result.reason, session: hangSessionOf(row) });
  })

  .put("/settings", zValidator("json", hangSettingsBody, invalidBody), async (c) => {
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const settings = {
      ...settingsOf(await repo.getHangSettings(c.env.DB, userId)),
      ...c.req.valid("json"),
    };
    await repo.saveHangSettings(c.env.DB, userId, settings);
    return c.json({ settings });
  });
