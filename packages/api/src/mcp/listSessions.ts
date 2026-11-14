import { parseClimbs } from "@sendtally/core";
import { z } from "zod";
import { withClimbNotes } from "../lib/climbs";
import * as repo from "../lib/repo";
import { climbInput, sessionTimes } from "./sessionForm";
import type { ConnectorTool } from "./types";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const inputSchema = {
  from: day.optional().describe("First day to include, YYYY-MM-DD."),
  to: day.optional().describe("Last day to include, YYYY-MM-DD."),
  includeClimbs: z.boolean().default(false).describe("Also return every climb of each session."),
  limit: z.number().int().min(1).max(100).default(20),
};

export const listSessions: ConnectorTool<typeof inputSchema> = {
  name: "list_sessions",
  title: "List climbing sessions",
  description:
    "The user's logged climbing sessions, newest first, each with its id, date, times, title, effort (RPE 1-10), top grades, location, gym and tags. Pass from and to to pick a date range, and includeClimbs to see each climb's name, grade, kind (send or attempt), style, tries and note, in the shape update_session takes back. Call get_climbing_summary first for an overview.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async ({ from, to, includeClimbs, limit }, { env, userId }) => {
    const [rows, tagsBySession, gyms, notes] = await Promise.all([
      repo.listSessions(env.DB, userId, includeClimbs),
      repo.tagsBySession(env.DB, userId),
      repo.listGyms(env.DB, userId),
      includeClimbs ? repo.listClimbNotes(env.DB, userId) : [],
    ]);
    const gymName = new Map(gyms.map((g) => [g.id, g.name]));
    const sessions = rows
      .filter(
        (r) =>
          (from === undefined || r.start_at >= from) &&
          (to === undefined || r.start_at.slice(0, 10) <= to)
      )
      .slice(0, limit)
      .map((row) => ({
        id: row.fingerprint,
        startAt: row.start_at,
        ...sessionTimes(row),
        title: row.title,
        name: row.name ?? undefined,
        rpe: row.rpe,
        topGrade: row.top_grade_label,
        topSendGrade: row.top_send_grade_label,
        location: row.location ?? undefined,
        gym: gymName.get(row.gym_id ?? ""),
        tags: tagsBySession.get(row.fingerprint)?.map((t) => t.name),
        readOnly: row.source === "manual" ? undefined : true,
        climbs: includeClimbs
          ? withClimbNotes(
              parseClimbs(row.climbs_json),
              notes.filter((n) => n.fingerprint === row.fingerprint)
            ).map(climbInput)
          : undefined,
      }));
    return { sessions };
  },
};
