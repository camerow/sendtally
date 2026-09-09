import { z } from "zod";
import type { ClimbGrade, ProjectRow, SessionRow } from "./repo";
import { tagSlug } from "./tags";

export const MAX_CLIMB_NAME_LENGTH = 200;

export type ClimbSummary = {
  slug: string;
  name: string;
  grade: ClimbGrade;
  project: boolean;
  sessions: number;
  attempts: number;
  sends: number;
  first_at: string;
  last_at: string;
};

const gradeJson = z.union([
  z.object({ scale: z.literal("v"), value: z.number().int() }),
  z.object({ scale: z.enum(["font", "yds", "french"]), value: z.string() }),
]);

export const projectBody = z.object({
  name: z.string().trim().min(1).max(MAX_CLIMB_NAME_LENGTH),
  grade: gradeJson,
});

export const climbSlug = tagSlug;

type StoredClimb = {
  name?: string;
  vGrade?: number;
  kind?: "send" | "attempt";
  tries?: number;
  grade?: ClimbGrade;
};

function storedGrade(climb: StoredClimb): ClimbGrade {
  const parsed = gradeJson.safeParse(climb.grade);
  if (parsed.success) return parsed.data;
  return { scale: "v", value: Math.max(0, climb.vGrade ?? 0) };
}

// Sessions arrive newest first, so the first sighting of a slug carries the
// name and grade the user typed most recently.
export function climbCatalogue(
  sessions: Array<Pick<SessionRow, "fingerprint" | "start_at"> & { climbs_json?: string | null }>,
  projects: ProjectRow[]
): ClimbSummary[] {
  const bySlug = new Map<string, ClimbSummary>();
  for (const session of sessions) {
    if (session.climbs_json == null) continue;
    const seen = new Set<string>();
    for (const climb of JSON.parse(session.climbs_json) as StoredClimb[]) {
      const name = (climb.name ?? "").trim();
      const slug = climbSlug(name);
      if (slug === "") continue;
      const tries = climb.tries ?? 1;
      const sends = climb.kind === "attempt" ? 0 : 1;
      const existing = bySlug.get(slug);
      if (existing === undefined) {
        bySlug.set(slug, {
          slug,
          name,
          grade: storedGrade(climb),
          project: false,
          sessions: 1,
          attempts: tries,
          sends,
          first_at: session.start_at,
          last_at: session.start_at,
        });
      } else {
        existing.attempts += tries;
        existing.sends += sends;
        existing.first_at = session.start_at;
        if (!seen.has(slug)) existing.sessions += 1;
      }
      seen.add(slug);
    }
  }
  for (const project of projects) {
    const existing = bySlug.get(project.slug);
    if (existing !== undefined) {
      existing.project = true;
      continue;
    }
    bySlug.set(project.slug, {
      slug: project.slug,
      name: project.name,
      grade: JSON.parse(project.grade_json) as ClimbGrade,
      project: true,
      sessions: 0,
      attempts: 0,
      sends: 0,
      first_at: project.created_at,
      last_at: project.created_at,
    });
  }
  return [...bySlug.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
}
