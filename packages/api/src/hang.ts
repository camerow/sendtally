import { zValidator } from "@hono/zod-validator";
import { BUILT_IN_GRIP_NAMES, isBuiltInGrip } from "@sendtally/core/hang";
import { Hono } from "hono";
import { type AppEnv, invalidBody, postAfterResponse } from "./context";
import {
  builtInGripNamed,
  builtInGripRow,
  gripKey,
  gripOf,
  measured,
  hangDefaultGripBody,
  hangGripBody,
  hangIdParam,
  hangLoadsBody,
  hangSessionBody,
  hangSessionOf,
  hangSettingsBody,
  hangWorkoutParam,
  settingsOf,
  type HangData,
} from "./lib/hang";
import { syncHangSessionToStrava } from "./lib/posting";
import * as repo from "./lib/repo";

// Hangboard and ground-pull training. The app generates every id,
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
      defaultGrips: Object.fromEntries(rows.defaultGrips.map((r) => [r.workout_id, r.grip_id])),
      loads: rows.loads,
      sessions: rows.sessions.map(hangSessionOf),
      settings: settingsOf(rows.settings),
      strava: { connected: strava?.status === "active" },
    };
    return c.json(data);
  })

  // Adding a grip by a name that already exists, built in or custom, in any
  // case, answers with that grip (showing it again if it was archived) instead
  // of making a second one. Renaming onto a name in use is a conflict, unless
  // only an archived custom grip holds it: that one gives the name up and keeps
  // its own. A built-in keeps its name; its row holds only its measure and
  // whether it is archived.
  .put(
    "/grips/:id",
    zValidator("param", hangIdParam, invalidBody),
    zValidator("json", hangGripBody, invalidBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const { name, measure } = c.req.valid("json");
      const userId = c.get("userId");
      if (isBuiltInGrip(id)) {
        const existing = await repo.getHangGrip(c.env.DB, userId, id);
        await repo.ensureUser(c.env.DB, userId);
        await repo.saveHangGrip(c.env.DB, userId, { ...builtInGripRow(id), measure });
        const saved = measured(measure ?? existing?.measure ?? "hang");
        return c.json({
          grip: { id, name: BUILT_IN_GRIP_NAMES[id], custom: false, hidden: false, ...saved },
        });
      }
      const nameKey = gripKey(name);
      const [existing, taken] = await Promise.all([
        repo.getHangGrip(c.env.DB, userId, id),
        repo.findHangGripByKey(c.env.DB, userId, nameKey),
      ]);
      const clash = taken !== null && taken.id !== id ? gripOf(taken) : builtInGripNamed(name);
      if (
        existing !== null &&
        taken !== null &&
        clash?.id === taken.id &&
        clash.custom &&
        clash.hidden
      ) {
        await repo.releaseHangGripName(c.env.DB, userId, taken);
      } else if (clash !== null && existing !== null) {
        return c.json({ error: "grip name taken" }, 409);
      } else if (clash !== null) {
        if (clash.hidden) await repo.showHangGrip(c.env.DB, userId, clash.id);
        return c.json({ grip: { ...clash, hidden: false } });
      }
      await repo.ensureUser(c.env.DB, userId);
      await repo.saveHangGrip(c.env.DB, userId, { id, name, nameKey, measure });
      const saved = measured(measure ?? existing?.measure ?? "hang");
      return c.json({ grip: { id, name, custom: true, hidden: false, ...saved } });
    }
  )

  .delete("/grips/:id", zValidator("param", hangIdParam, invalidBody), async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("userId");
    const existing = await repo.getHangGrip(c.env.DB, userId, id);
    if (existing === null) {
      if (!isBuiltInGrip(id)) return c.json({ deleted: false });
      await repo.ensureUser(c.env.DB, userId);
      await repo.saveHangGrip(c.env.DB, userId, builtInGripRow(id));
    }
    await repo.hideHangGrip(c.env.DB, userId, id);
    return c.json({ deleted: true });
  })

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
