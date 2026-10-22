import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AppEnv, invalidBody, postAfterResponse } from "./context";
import {
  activitiesQuery,
  activityBody,
  activityOf,
  planItemBody,
  planItemOf,
  planItemSkipBody,
  trainingIdParam,
} from "./lib/activities";
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

export const planItems = new Hono<AppEnv>()
  .get("/", async (c) => {
    const rows = await repo.listPlanItems(c.env.DB, c.get("userId"));
    return c.json({ planItems: rows.map(planItemOf) });
  })

  .put(
    "/:id",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", planItemBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      const row = await repo.savePlanItem(c.env.DB, userId, { id, ...c.req.valid("json") });
      return c.json({ planItem: planItemOf(row) });
    }
  )

  // Skips or restores one date without the app resending the whole item.
  .put(
    "/:id/skip",
    zValidator("param", trainingIdParam, invalidBody),
    zValidator("json", planItemSkipBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const { date, skipped } = c.req.valid("json");
      const userId = c.get("userId");
      const row = await repo.getPlanItem(c.env.DB, userId, id);
      if (row === null) return c.json({ error: "not found" }, 404);
      const item = planItemOf(row);
      const skip = skipped ? [...item.skip, date] : item.skip.filter((d) => d !== date);
      const saved = await repo.savePlanItem(c.env.DB, userId, { ...item, skip });
      return c.json({ planItem: planItemOf(saved) });
    }
  )

  // The item goes; activities logged against it stay.
  .delete("/:id", zValidator("param", trainingIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    return c.json({ deleted: await repo.deletePlanItem(c.env.DB, c.get("userId"), id) });
  });
