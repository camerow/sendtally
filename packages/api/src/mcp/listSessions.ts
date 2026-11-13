import { z } from "zod";
import * as repo from "../lib/repo";
import type { ConnectorTool } from "./types";

const inputSchema = { limit: z.number().int().min(1).max(100).default(20) };

export const listSessions: ConnectorTool<typeof inputSchema> = {
  name: "list_sessions",
  title: "List climbing sessions",
  description:
    "The user's logged climbing sessions, newest first, each with its date, title, effort (RPE 1-10) and top grades.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async ({ limit }, { env, userId }) => {
    const rows = await repo.listSessions(env.DB, userId);
    const sessions = rows.slice(0, limit).map((row) => ({
      id: row.fingerprint,
      startAt: row.start_at,
      title: row.title,
      rpe: row.rpe,
      topGrade: row.top_grade_label,
      topSendGrade: row.top_send_grade_label,
    }));
    return { sessions };
  },
};
