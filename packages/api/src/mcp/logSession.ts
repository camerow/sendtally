import { postAfterResponse } from "../context";
import { importSessionShape, manualBodyOf } from "../lib/import";
import { syncSessionToStrava } from "../lib/posting";
import * as repo from "../lib/repo";
import { gymIdsByName, writeManualSession } from "../sessions";
import type { ConnectorTool } from "./types";

const inputSchema = importSessionShape.shape;

export const logSession: ConnectorTool<typeof inputSchema> = {
  name: "log_session",
  title: "Log a climbing session",
  description:
    'Logs one climbing session the user describes, as the app\'s log-session form does. date is YYYY-MM-DD; startTime and endTime are HH:MM, 24 hour, at most 12 hours apart. location is "indoor" or "outdoor"; gym is a gym name, matched against the user\'s gyms. Each climb has a grade written as logged, never converted: {scale: "v", value: 4} for V4, or scale "font", "yds" or "french" with the grade text such as "6A+", "5.11b" or "7a". kind is "send" or "attempt", style "flash", "onsight" (routes only) or "redpoint" for sends, tries 1 to 99 (a flash or onsight is one try). Leave rpe out unless the user gives their effort on a 1-10 scale; Sendtally scores it from the climbs and their history. Posts to Strava when the user has Strava posting on. To log several past sessions at once, use import_climbing_log.',
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async (args, { c, env, userId }) => {
    const parsed = importSessionShape.safeParse(args);
    if (!parsed.success) return { error: parsed.error.message };
    const session = {
      ...parsed.data,
      climbs: parsed.data.climbs.map(({ climbId: _, userClimbId: __, ...climb }) => climb),
    };
    await repo.ensureUser(env.DB, userId);
    const gymIdByName = await gymIdsByName(env.DB, userId);
    const fingerprint = `manual-${crypto.randomUUID()}`;
    await writeManualSession(c, fingerprint, manualBodyOf(session, gymIdByName), true);
    postAfterResponse(c, fingerprint, () => syncSessionToStrava(env, userId, fingerprint));
    const row = await repo.getSession(env.DB, userId, fingerprint);
    return { title: row?.title, rpe: row?.rpe, startAt: row?.start_at };
  },
};
