import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AppEnv, invalidBody, postAfterResponse } from "./context";
import { activitiesQuery, activityBody, activityOf } from "./lib/activities";
import {
  blockBody,
  blockOf,
  membershipBody,
  membershipOf,
  trainingIdParam,
  weekChangeBody,
  weekChangeOf,
  workoutBody,
  workoutOf,
  type Plan,
} from "./lib/plan";
import { syncActivityToStrava } from "./lib/posting";
import * as repo from "./lib/repo";

const ACTIVITY_LIST_LIMIT = 1000;

// Training other than climbing and hangboarding. The app generates every id,
// so each write is an idempotent PUT it can retry or replay offline.
export const activities = new Hono<AppEnv>()
  .get("/", zValidator("query", activitiesQuery, invalidBody), async (c) => {
    const rows = await repo.listActivities(
      c.env.DB,
      c.get("userId"),
      c.req.valid("query"),
      ACTIVITY_LIST_LIMIT
    );
    return c.json({ activities: rows.map(activityOf) });
  })

  // Creates or edits. A new activity posts to Strava when the user turned that
  // on; an edit of a posted one patches its activity, never posts a second.
  .put(
    "/:id",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", activityBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const existing = await repo.getActivity(c.env.DB, userId, id);
      const row = await repo.saveActivity(c.env.DB, userId, id, c.req.valid("json"));
      if (existing === null || existing.strava_activity_id !== null) {
        postAfterResponse(c, id, () => syncActivityToStrava(c.env, userId, id));
      }
      return c.json({ activity: activityOf(row) });
    }
  )

  // Its Strava activity, if any, stays on Strava.
  .delete("/:id", zValidator("param", trainingIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deleteActivity(c.env.DB, c.get("userId"), id) });
  })

  .post("/:id/strava", zValidator("param", trainingIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("userId");
    if ((await repo.getActivity(c.env.DB, userId, id)) === null) {
      return c.json({ error: "not found" }, 404);
    }
    const result = await syncActivityToStrava(c.env, userId, id, true);
    if (result.outcome === "failed") {
      return c.json({ outcome: result.outcome, reason: result.reason }, 502);
    }
    const row = await repo.getActivity(c.env.DB, userId, id);
    if (row === null) return c.json({ error: "not found" }, 404);
    return c.json({ outcome: result.outcome, reason: result.reason, activity: activityOf(row) });
  });

// Blocks, memberships and their week changes, in one read.
export const plan = new Hono<AppEnv>().get("/", async (c) => {
  const rows = await repo.planRows(c.env.DB, c.get("userId"));
  const body: Plan = {
    blocks: rows.blocks.map(blockOf),
    memberships: rows.memberships.map(membershipOf),
    weekChanges: rows.weekChanges.map(weekChangeOf),
  };
  return c.json(body);
});

export const blocks = new Hono<AppEnv>()
  .put(
    "/:id",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", blockBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const row = await repo.saveBlock(c.env.DB, userId, { id, ...c.req.valid("json") });
      return c.json({ block: blockOf(row) });
    }
  )

  // Its memberships go with it; sessions logged against them keep what was done.
  .delete("/:id", zValidator("param", trainingIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deleteBlock(c.env.DB, c.get("userId"), id) });
  });

export const memberships = new Hono<AppEnv>()
  .put(
    "/:id",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", membershipBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      const body = c.req.valid("json");
      if (body.blockId !== null && (await repo.getBlock(c.env.DB, userId, body.blockId)) === null) {
        return c.json({ error: "no such block" }, 400);
      }
      await repo.ensureUser(c.env.DB, userId);
      const row = await repo.saveMembership(c.env.DB, userId, { id, ...body });
      return c.json({ membership: membershipOf(row) });
    }
  )

  // Its week changes go with it; sessions logged against it keep what was done.
  .delete("/:id", zValidator("param", trainingIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deleteMembership(c.env.DB, c.get("userId"), id) });
  })

  // Sets what one week changes about one item. An empty change is the item as written.
  .put(
    "/:id/changes",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", weekChangeBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      if ((await repo.getMembership(c.env.DB, userId, id)) === null) {
        return c.json({ error: "not found" }, 404);
      }
      const weekChange = { membershipId: id, ...c.req.valid("json") };
      await repo.saveWeekChange(c.env.DB, userId, weekChange);
      return c.json({ weekChange });
    }
  );

// The user's own library workouts of every kind. Built-in workouts live in the
// apps; a customised one is a copy saved here under a new id.
export const workouts = new Hono<AppEnv>()
  .get("/", async (c) => {
    const rows = await repo.listWorkouts(c.env.DB, c.get("userId"));
    return c.json({ workouts: rows.map(workoutOf) });
  })

  .put(
    "/:id",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", workoutBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const row = await repo.saveWorkout(c.env.DB, userId, { id, ...c.req.valid("json") });
      return c.json({ workout: workoutOf(row) });
    }
  )

  // It leaves every block; sessions that ran it keep what was done and lose only the link.
  .delete("/:id", zValidator("param", trainingIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deleteWorkout(c.env.DB, c.get("userId"), id) });
  });
