import { z } from "zod";
import { climbSlug } from "../lib/climbs";
import { manualSessionBody, manualSessionShape } from "../lib/manual";
import { editManualSession, gymIdsByName, sessionResponse } from "../sessions";
import { dayAreaId, editableSession } from "./sessionForm";
import type { ConnectorTool } from "./types";

const { name, date, startTime, endTime, minutes, rpe, location, tags, notes, climbs } =
  manualSessionShape.shape;

export const sessionId = z.string().min(1).max(100);

const inputSchema = {
  id: sessionId.describe("The session's id, from list_sessions."),
  name: name.describe("The session's own name; without one the title is generated."),
  date: date.optional(),
  startTime: startTime.describe("HH:MM, 24 hour."),
  endTime: endTime.describe("HH:MM, 24 hour."),
  minutes: minutes.describe(
    "How long the session lasted, 1 to 720, when its start and end times are not both known. With one of them it sets the other; null clears it."
  ),
  rpe,
  location,
  gym: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .optional()
    .describe("A gym name, matched against the user's gyms."),
  tags,
  notes,
  climbs: climbs.optional(),
};

export const updateSession: ConnectorTool<typeof inputSchema> = {
  name: "update_session",
  title: "Edit a climbing session",
  description:
    'Edits one of the user\'s logged sessions, as editing it in the app does: it keeps its id and its Strava activity, which is updated rather than posted again, and its effort (RPE) is scored again unless the user gave one. Pass only what changes; every field left out keeps its current value. climbs replaces the whole list, so to change one climb call list_sessions with includeClimbs, copy every climb as it came back, change that one (for example kind "send" to "attempt", or add a style), and send them all; a climb\'s note is cleared if it is left out. Grades, kinds, styles and tries follow the rules of log_session. Sessions synced from a climbing board before manual logging are read-only history and cannot be edited, only deleted.',
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ id, gym, climbs: changedClimbs, ...changes }, { c, env, userId }) => {
    const current = await sessionResponse(env, userId, id);
    if (current === null) return { error: `No session with id ${id}.` };
    if (current.source !== "manual") {
      return {
        error:
          "This session was synced from a climbing board and is read-only history. It can be deleted, not edited.",
      };
    }
    const base = editableSession(current);
    const gymId =
      gym === undefined ? base.gymId : (await gymIdsByName(env.DB, userId)).get(gym.toLowerCase());
    if (gymId === undefined && gym !== undefined) return { error: `No gym named ${gym}.` };
    const named = new Map(base.climbs.map((climb) => [climbSlug(climb.name?.trim() ?? ""), climb]));
    const dayArea = dayAreaId(current);
    const form = {
      ...base,
      ...changes,
      ...(gymId === undefined ? {} : { gymId }),
      climbs:
        changedClimbs?.map(({ climbId: _, areaId: __, userClimbId: ___, ...climb }) => {
          const slug = climbSlug(climb.name.trim());
          const was = slug === "" ? undefined : named.get(slug);
          const areaId = slug === "" ? dayArea : was?.areaId;
          return {
            ...climb,
            ...(was?.userClimbId === undefined ? {} : { userClimbId: was.userClimbId }),
            ...(was?.climbId === undefined ? {} : { climbId: was.climbId }),
            ...(areaId === undefined ? {} : { areaId }),
          };
        }) ?? base.climbs,
    };
    const parsed = manualSessionBody.safeParse(form);
    if (!parsed.success) return { error: parsed.error.message };
    const result = await editManualSession(c, id, parsed.data);
    if ("error" in result) return { error: result.error };
    const { session } = result;
    return { id, title: session.title, rpe: session.rpe, startAt: session.start_at };
  },
};
