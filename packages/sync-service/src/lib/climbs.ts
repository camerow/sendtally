import { disciplineOf, type Discipline } from "@sendtally/core";
import { z } from "zod";
import * as repo from "./repo";
import type { ClimbGrade, ProjectRow, SessionRow } from "./repo";
import { tagSlug } from "./tags";

export const MAX_CLIMB_NAME_LENGTH = 200;
export const MAX_BETA_LENGTH = 2000;

const gradeJson = z.union([
  z.object({ scale: z.literal("v"), value: z.number().int() }),
  z.object({ scale: z.enum(["font", "yds", "french"]), value: z.string() }),
]);

// A project can be added before the climb has been logged, so the grade is
// optional: without one it arrives with the first session the climb is in.
export const projectBody = z.object({
  name: z.string().trim().min(1).max(MAX_CLIMB_NAME_LENGTH),
  discipline: z.enum(["boulder", "route"]).optional(),
  grade: gradeJson.optional(),
  beta: z.string().max(MAX_BETA_LENGTH).optional(),
});

export type ProjectInput = z.input<typeof projectBody>;

export type ClimbSummary = {
  slug: string;
  name: string;
  grade: ClimbGrade | null;
  discipline: Discipline;
  project: boolean;
  beta: string | null;
  beta_updated_at: string | null;
  sessions: number;
  attempts: number;
  sends: number;
  first_at: string;
  last_at: string;
};

export const climbSlug = tagSlug;

type FlaggedClimb = { name: string; grade: ClimbGrade; project?: boolean | undefined };

// A climb's project flag rides along with the session it was logged in and is
// only sent when the user touched it, so an untouched form never unmarks.
export async function applyProjectFlags(
  db: D1Database,
  userId: string,
  climbs: FlaggedClimb[]
): Promise<void> {
  for (const climb of climbs) {
    if (climb.project === undefined) continue;
    const name = climb.name.trim();
    const slug = climbSlug(name);
    if (slug === "") continue;
    if (climb.project) await repo.upsertProject(db, userId, { slug, name, grade: climb.grade });
    else await repo.deleteProject(db, userId, slug);
  }
}

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
        const grade = storedGrade(climb);
        bySlug.set(slug, {
          slug,
          name,
          grade,
          discipline: disciplineOf(grade.scale),
          project: false,
          beta: null,
          beta_updated_at: null,
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
      existing.beta = project.beta;
      existing.beta_updated_at = project.beta_updated_at;
      continue;
    }
    const grade =
      project.grade_json === null ? null : (JSON.parse(project.grade_json) as ClimbGrade);
    bySlug.set(project.slug, {
      slug: project.slug,
      name: project.name,
      grade,
      discipline: grade === null ? project.discipline : disciplineOf(grade.scale),
      project: true,
      beta: project.beta,
      beta_updated_at: project.beta_updated_at,
      sessions: 0,
      attempts: 0,
      sends: 0,
      first_at: project.created_at,
      last_at: project.created_at,
    });
  }
  return [...bySlug.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
}
