import { disciplineOf, effortGrade, formatGrade, parseClimbs, type Grade } from "@sendtally/core";
import { z } from "zod";
import * as repo from "../lib/repo";
import type { ConnectorTool } from "./types";

const inputSchema = {
  weeks: z.number().int().min(1).max(104).default(12).describe("How many weeks back to summarise."),
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const climbingSummary: ConnectorTool<typeof inputSchema> = {
  name: "get_climbing_summary",
  title: "Summarise climbing",
  description:
    "An overview of the user's climbing over the last few weeks (12 by default): sessions per week, average effort (RPE 1-10) per week, the hardest grade sent and tried in each discipline (boulder, route), and the grade pyramid of sends. Call this first when planning training or judging the user's level.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async ({ weeks }, { env, userId }) => {
    const since = new Date(Date.now() - weeks * WEEK_MS).toISOString();
    const rows = (await repo.listSessions(env.DB, userId, true)).filter((r) => r.start_at >= since);
    const byWeek = new Map<string, number[]>();
    const top: Record<string, { sent?: Grade; tried?: Grade }> = {};
    const pyramid: Record<string, Map<string, { grade: Grade; sends: number }>> = {};
    for (const row of rows) {
      const monday = new Date(row.start_at);
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const week = monday.toISOString().slice(0, 10);
      byWeek.set(week, [...(byWeek.get(week) ?? []), row.rpe]);
      for (const climb of parseClimbs(row.climbs_json)) {
        const grade = climb.grade ?? { scale: "v", value: climb.vGrade };
        if (effortGrade(grade) < 0) continue;
        const d = disciplineOf(grade.scale);
        const best = (top[d] ??= {});
        const higher = (g?: Grade): boolean =>
          g === undefined || effortGrade(grade) > effortGrade(g);
        if (higher(best.tried)) best.tried = grade;
        if (climb.kind !== "send") continue;
        if (higher(best.sent)) best.sent = grade;
        const label = formatGrade(grade);
        const level = (pyramid[d] ??= new Map()).get(label) ?? { grade, sends: 0 };
        pyramid[d].set(label, { grade, sends: level.sends + 1 });
      }
    }
    return {
      weeks,
      sessions: rows.length,
      sessionsPerWeek: Math.round((rows.length / weeks) * 10) / 10,
      rpeByWeek: [...byWeek]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, rpes]) => ({
          week,
          sessions: rpes.length,
          averageRpe: Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10,
        })),
      disciplines: Object.entries(top).map(([discipline, best]) => ({
        discipline,
        hardestSend: best.sent === undefined ? null : formatGrade(best.sent),
        hardestTried: best.tried === undefined ? null : formatGrade(best.tried),
        sendPyramid: [...(pyramid[discipline]?.entries() ?? [])]
          .sort(([, a], [, b]) => effortGrade(b.grade) - effortGrade(a.grade))
          .map(([grade, { sends }]) => ({ grade, sends })),
      })),
    };
  },
};
