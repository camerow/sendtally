import { formatGrade, parseClimbs, type StoredClimb } from "@sendtally/core";
import { z } from "zod";
import * as repo from "../lib/repo";
import type { ConnectorTool } from "./types";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const inputSchema = {
  from: day.optional().describe("First day to include, YYYY-MM-DD."),
  to: day.optional().describe("Last day to include, YYYY-MM-DD."),
  includeClimbs: z.boolean().default(false).describe("Also return every climb of each session."),
  limit: z.number().int().min(1).max(100).default(20),
};

export const climbOf = (c: StoredClimb): { grade: string } & Record<string, unknown> => ({
  name: c.name || undefined,
  grade: formatGrade(c.grade ?? { scale: "v", value: c.vGrade }),
  kind: c.kind,
  tries: c.tries,
  style: c.style,
});

export const listSessions: ConnectorTool<typeof inputSchema> = {
  name: "list_sessions",
  title: "List climbing sessions",
  description:
    "The user's logged climbing sessions, newest first, each with its date, title, effort (RPE 1-10) and top grades. Pass from and to to pick a date range, and includeClimbs to see each climb's grade, whether it was a send or an attempt, and its tries. Call get_climbing_summary first for an overview.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async ({ from, to, includeClimbs, limit }, { env, userId }) => {
    const rows = await repo.listSessions(env.DB, userId, includeClimbs);
    const sessions = rows
      .filter(
        (r) =>
          (from === undefined || r.start_at >= from) &&
          (to === undefined || r.start_at.slice(0, 10) <= to)
      )
      .slice(0, limit)
      .map((row) => ({
        startAt: row.start_at,
        title: row.title,
        rpe: row.rpe,
        topGrade: row.top_grade_label,
        topSendGrade: row.top_send_grade_label,
        climbs: includeClimbs ? parseClimbs(row.climbs_json).map(climbOf) : undefined,
      }));
    return { sessions };
  },
};
