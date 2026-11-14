import { z } from "zod";
import { deleteOwnSession } from "../sessions";
import { sessionId } from "./updateSession";
import type { ConnectorTool } from "./types";

export const DELETE_SESSIONS_MAX = 100;

const inputSchema = {
  ids: z
    .array(sessionId)
    .min(1)
    .max(DELETE_SESSIONS_MAX)
    .describe("The sessions' ids, from list_sessions."),
};

export const deleteSession: ConnectorTool<typeof inputSchema> = {
  name: "delete_session",
  title: "Delete climbing sessions",
  description: `Deletes up to ${DELETE_SESSIONS_MAX} of the user's logged sessions, as deleting them in the app does: their climbs, tags and climb notes go with them, journal entries about them stay, and anything already posted to Strava stays on Strava. Before calling it, name every session that will be deleted (date and title) and get the user's yes; it cannot be undone. Each id is reported on its own: deleted true, or deleted false with the reason, so one unknown id never stops the rest.`,
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: true },
  run: async ({ ids }, { c }) => {
    const results = [];
    for (const id of new Set(ids)) {
      results.push(
        (await deleteOwnSession(c, id))
          ? { id, deleted: true }
          : { id, deleted: false, error: "not found" }
      );
    }
    return { results };
  },
};
