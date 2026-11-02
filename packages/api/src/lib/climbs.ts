import { disciplineOf, type Discipline } from "@sendtally/core";
import { z } from "zod";
import * as repo from "./repo";
import type { ClimbGrade, SessionRow, UserClimbRow } from "./repo";
import { tagSlug } from "./tags";

export const MAX_CLIMB_NAME_LENGTH = 200;

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
});

export type ProjectInput = z.input<typeof projectBody>;

export type ClimbSummary = {
  id: string;
  slug: string;
  name: string;
  grade: ClimbGrade | null;
  discipline: Discipline;
  project: boolean;
  area_climb_id: string | null;
  area: { id: string; name: string } | null;
  sessions: number;
  attempts: number;
  sends: number;
  first_at: string;
  last_at: string;
  sent_at: string | null;
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
    if (climb.project)
      await repo.markWorking(db, userId, { name_key: slug, name, grade: climb.grade });
    else await repo.stopWorking(db, userId, slug);
  }
}

type NotedClimb = { name: string; note?: string | undefined };

// A note belongs to a named climb in a session, so two rows for the same climb
// share one note and the last one the user wrote is the one kept.
export function climbNotesOf(climbs: NotedClimb[]): repo.ClimbNoteInput[] {
  const bySlug = new Map<string, repo.ClimbNoteInput>();
  for (const climb of climbs) {
    const note = climb.note?.trim() ?? "";
    const slug = climbSlug(climb.name.trim());
    if (slug === "" || note === "") continue;
    bySlug.set(slug, { climb_slug: slug, note });
  }
  return [...bySlug.values()];
}

export function withClimbNotes<T extends { name: string }>(
  climbs: T[],
  notes: repo.ClimbNoteRow[]
): Array<T & { note: string | null }> {
  const bySlug = new Map(notes.map((n) => [n.climb_slug, n.note]));
  return climbs.map((climb) => ({
    ...climb,
    note: bySlug.get(climbSlug(climb.name.trim())) ?? null,
  }));
}

type StoredClimb = {
  name?: string;
  vGrade?: number;
  kind?: "send" | "attempt";
  tries?: number;
  grade?: ClimbGrade;
  userClimbId?: string;
};

type CatalogueSession = Pick<SessionRow, "fingerprint" | "start_at"> & {
  climbs_json?: string | null;
  area_id?: string | null;
  source?: string;
};

function storedGrade(climb: StoredClimb): ClimbGrade {
  const parsed = gradeJson.safeParse(climb.grade);
  if (parsed.success) return parsed.data;
  return { scale: "v", value: Math.max(0, climb.vGrade ?? 0) };
}

function namedClimbs(session: CatalogueSession): Array<StoredClimb & { name: string }> {
  if (session.climbs_json == null) return [];
  return (JSON.parse(session.climbs_json) as StoredClimb[]).flatMap((c) => {
    const name = (c.name ?? "").trim();
    return climbSlug(name) === "" ? [] : [{ ...c, name }];
  });
}

export type ClimbResolver = (climb: {
  name: string;
  userClimbId?: string | undefined;
}) => UserClimbRow | undefined;

// A stamped id wins; anything else is the climb under its name.
export function climbResolver(records: UserClimbRow[]): ClimbResolver {
  const byId = new Map(records.map((r) => [r.id, r]));
  const byKey = new Map(records.map((r) => [r.name_key, r]));
  return (climb) =>
    (climb.userClimbId === undefined ? undefined : byId.get(climb.userClimbId)) ??
    byKey.get(climbSlug(climb.name));
}

export type MissingClimbs = {
  create: repo.UserClimbInput[];
  link: Array<{ id: string; area_climb_id: string }>;
};

// Named climbs logged before records existed get one, and a record logged
// against an Areas climb picks up that link.
export function missingClimbs(
  sessions: CatalogueSession[],
  records: UserClimbRow[],
  links: Array<{ climb_slug: string; climb_id: string }>
): MissingClimbs {
  const resolve = climbResolver(records);
  const linkBySlug = new Map(links.map((l) => [l.climb_slug, l.climb_id]));
  const create = new Map<string, repo.UserClimbInput>();
  for (const session of sessions) {
    for (const climb of namedClimbs(session)) {
      const key = climbSlug(climb.name);
      if (resolve(climb) !== undefined || create.has(key)) continue;
      const grade = storedGrade(climb);
      create.set(key, {
        name: climb.name,
        name_key: key,
        discipline: disciplineOf(grade.scale),
        grade_json: JSON.stringify(grade),
        area_climb_id: linkBySlug.get(key) ?? null,
      });
    }
  }
  const link = records.flatMap((r) => {
    const id = linkBySlug.get(r.name_key);
    return r.area_climb_id === null && id !== undefined ? [{ id: r.id, area_climb_id: id }] : [];
  });
  return { create: [...create.values()], link };
}

// Sessions arrive newest first, so the first sighting of a climb carries the
// name and grade the user logged most recently, and the crag it was last at.
export function climbCatalogue(
  sessions: CatalogueSession[],
  records: UserClimbRow[],
  areaNames: ReadonlyMap<string, string> = new Map()
): ClimbSummary[] {
  const resolve = climbResolver(records);
  const byId = new Map<string, ClimbSummary>();
  for (const session of sessions) {
    const seen = new Set<string>();
    for (const climb of namedClimbs(session)) {
      const record = resolve(climb);
      if (record === undefined) continue;
      const tries = climb.tries ?? 1;
      const sent = climb.kind !== "attempt";
      const areaName = session.area_id == null ? undefined : areaNames.get(session.area_id);
      const area =
        session.area_id == null || areaName === undefined
          ? null
          : { id: session.area_id, name: areaName };
      const existing = byId.get(record.id);
      if (existing === undefined) {
        const grade = storedGrade(climb);
        byId.set(record.id, {
          id: record.id,
          slug: record.name_key,
          name: record.name,
          grade,
          discipline: disciplineOf(grade.scale),
          project: record.working,
          area_climb_id: record.area_climb_id,
          area,
          sessions: 1,
          attempts: tries,
          sends: sent ? 1 : 0,
          first_at: session.start_at,
          last_at: session.start_at,
          sent_at: sent ? session.start_at : null,
        });
      } else {
        existing.attempts += tries;
        existing.sends += sent ? 1 : 0;
        existing.first_at = session.start_at;
        existing.area ??= area;
        if (sent) existing.sent_at = session.start_at;
        if (!seen.has(record.id)) existing.sessions += 1;
      }
      seen.add(record.id);
    }
  }
  for (const record of records) {
    if (byId.has(record.id) || !record.working) continue;
    const grade = record.grade_json === null ? null : (JSON.parse(record.grade_json) as ClimbGrade);
    byId.set(record.id, {
      id: record.id,
      slug: record.name_key,
      name: record.name,
      grade,
      discipline: grade === null ? record.discipline : disciplineOf(grade.scale),
      project: true,
      area_climb_id: record.area_climb_id,
      area: null,
      sessions: 0,
      attempts: 0,
      sends: 0,
      first_at: record.created_at,
      last_at: record.created_at,
      sent_at: null,
    });
  }
  return [...byId.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
}

export const renameBody = z.object({
  name: z.string().trim().min(1).max(MAX_CLIMB_NAME_LENGTH).optional(),
  working: z.boolean().optional(),
});

// Every manual climb that is this one now carries the id of the climb it
// becomes, so a rename keeps its history and a merge folds it in.
export function restampedSessions(
  sessions: CatalogueSession[],
  records: UserClimbRow[],
  from: UserClimbRow,
  toId: string
): Array<{ fingerprint: string; climbs_json: string }> {
  const resolve = climbResolver(records);
  return sessions.flatMap((session) => {
    if (session.source !== "manual" || session.climbs_json == null) return [];
    const climbs = JSON.parse(session.climbs_json) as StoredClimb[];
    let changed = false;
    const next = climbs.map((c) => {
      const name = (c.name ?? "").trim();
      if (climbSlug(name) === "" || resolve({ ...c, name })?.id !== from.id) return c;
      changed = true;
      return { ...c, userClimbId: toId };
    });
    return changed ? [{ fingerprint: session.fingerprint, climbs_json: JSON.stringify(next) }] : [];
  });
}
