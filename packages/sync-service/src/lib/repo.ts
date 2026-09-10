import { and, asc, count, desc, eq, inArray, notInArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  boardConnections,
  projects,
  sessions,
  sessionTags,
  storeEntitlements,
  stravaConnections,
  syncState,
  tags,
  users,
} from "../db/schema";
import type { StoreEntitlement } from "./revenuecat";
import type { NormalizedTag } from "./tags";

export type UserRow = typeof users.$inferSelect;

export type StravaConnectionRow = typeof stravaConnections.$inferSelect;

export type SessionRow = {
  fingerprint: string;
  board: string | null;
  source: string;
  location: string | null;
  name: string | null;
  start_at: string;
  end_at: string;
  climb_count: number;
  top_grade: number;
  top_send_grade: number;
  top_grade_label: string | null;
  top_send_grade_label: string | null;
  rpe: number;
  title: string;
  notes: string | null;
  strava_activity_id: number | null;
  posted_at: string | null;
  post_state: string | null;
  post_error: string | null;
};

const sessionListColumns = {
  fingerprint: sessions.fingerprint,
  board: sessions.board,
  source: sessions.source,
  location: sessions.location,
  name: sessions.name,
  start_at: sessions.start_at,
  end_at: sessions.end_at,
  climb_count: sessions.climb_count,
  top_grade: sessions.top_grade,
  top_send_grade: sessions.top_send_grade,
  top_grade_label: sessions.top_grade_label,
  top_send_grade_label: sessions.top_send_grade_label,
  rpe: sessions.rpe,
  title: sessions.title,
  notes: sessions.notes,
  strava_activity_id: sessions.strava_activity_id,
  posted_at: sessions.posted_at,
  post_state: sessions.post_state,
  post_error: sessions.post_error,
};

export async function upsertUser(db: D1Database, id: string, timezone: string): Promise<void> {
  await drizzle(db)
    .insert(users)
    .values({ id, timezone, created_at: new Date().toISOString() })
    .onConflictDoUpdate({ target: users.id, set: { timezone } });
}

export async function ensureUser(db: D1Database, id: string): Promise<void> {
  await drizzle(db)
    .insert(users)
    .values({ id, created_at: new Date().toISOString() })
    .onConflictDoNothing();
}

export async function getUser(db: D1Database, id: string): Promise<UserRow | null> {
  const row = await drizzle(db).select().from(users).where(eq(users.id, id)).get();
  return row ?? null;
}

export type StravaConnectionInput = {
  user_id: string;
  athlete_id: number;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  expires_at: number;
};

export async function upsertStravaConnection(
  db: D1Database,
  row: StravaConnectionInput
): Promise<void> {
  const connected_at = new Date().toISOString();
  await drizzle(db)
    .insert(stravaConnections)
    .values({ ...row, status: "active", connected_at })
    .onConflictDoUpdate({
      target: stravaConnections.user_id,
      set: {
        athlete_id: row.athlete_id,
        access_token_ciphertext: row.access_token_ciphertext,
        refresh_token_ciphertext: row.refresh_token_ciphertext,
        expires_at: row.expires_at,
        status: "active",
        connected_at,
      },
    });
}

export async function getStravaConnection(
  db: D1Database,
  userId: string
): Promise<StravaConnectionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(stravaConnections)
    .where(eq(stravaConnections.user_id, userId))
    .get();
  return row ?? null;
}

export async function updateStravaTokens(
  db: D1Database,
  userId: string,
  accessTokenCiphertext: string,
  refreshTokenCiphertext: string,
  expiresAt: number
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({
      access_token_ciphertext: accessTokenCiphertext,
      refresh_token_ciphertext: refreshTokenCiphertext,
      expires_at: expiresAt,
    })
    .where(eq(stravaConnections.user_id, userId));
}

export async function markStravaConnectionDeadByAthlete(
  db: D1Database,
  athleteId: number
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({ status: "dead" })
    .where(eq(stravaConnections.athlete_id, athleteId));
}

export type StoreEntitlementRow = typeof storeEntitlements.$inferSelect;

export async function listStoreEntitlements(
  db: D1Database,
  userId: string
): Promise<StoreEntitlementRow[]> {
  return drizzle(db)
    .select()
    .from(storeEntitlements)
    .where(eq(storeEntitlements.user_id, userId))
    .all();
}

export async function replaceStoreEntitlements(
  db: D1Database,
  userId: string,
  rows: StoreEntitlement[]
): Promise<void> {
  const d = drizzle(db);
  const clear = d.delete(storeEntitlements).where(eq(storeEntitlements.user_id, userId));
  if (rows.length === 0) {
    await clear;
    return;
  }
  const updated_at = new Date().toISOString();
  await d.batch([
    clear,
    d.insert(storeEntitlements).values(
      rows.map((r) => ({
        user_id: userId,
        entitlement: r.entitlement,
        store: r.store,
        product_id: r.product_id,
        expires_at: r.expires_at,
        will_renew: r.will_renew ? 1 : 0,
        updated_at,
      }))
    ),
  ]);
}

export type ManualSessionInput = {
  fingerprint: string;
  location: string;
  name: string | null;
  start_at: string;
  end_at: string;
  climb_count: number;
  top_grade: number;
  top_send_grade: number;
  top_grade_label: string | null;
  top_send_grade_label: string | null;
  rpe: number;
  title: string;
  summary: string;
  climbs_json: string;
  notes: string | null;
};

export async function insertManualSession(
  db: D1Database,
  userId: string,
  s: ManualSessionInput
): Promise<void> {
  await drizzle(db)
    .insert(sessions)
    .values({ user_id: userId, source: "manual", board: null, ...s });
}

export async function updateManualSession(
  db: D1Database,
  userId: string,
  s: ManualSessionInput
): Promise<boolean> {
  const { fingerprint, ...rest } = s;
  const result = await drizzle(db)
    .update(sessions)
    .set(rest)
    .where(
      and(
        eq(sessions.user_id, userId),
        eq(sessions.fingerprint, fingerprint),
        eq(sessions.source, "manual")
      )
    );
  return result.meta.changes > 0;
}

// Any session the user owns can be deleted, board-sourced history included.
// Removing a row of your own is not a refresh: it calls nothing upstream and
// re-scores nothing. Editing a board row stays blocked, since that would
// re-score history we can no longer verify.
export async function deleteSession(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .delete(sessions)
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
  if (result.meta.changes === 0) return false;
  await d
    .delete(sessionTags)
    .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint)));
  await pruneUnusedTags(d, userId);
  return true;
}

export type TagRow = { id: string; name: string; slug: string };

export type TagSummary = TagRow & { session_count: number };

type Db = ReturnType<typeof drizzle>;

const tagColumns = { id: tags.id, name: tags.name, slug: tags.slug };

function pruneUnusedTags(d: Db, userId: string): Promise<unknown> {
  const used = d
    .select({ tag_id: sessionTags.tag_id })
    .from(sessionTags)
    .where(eq(sessionTags.user_id, userId));
  return d.delete(tags).where(and(eq(tags.user_id, userId), notInArray(tags.id, used)));
}

export async function listTags(db: D1Database, userId: string): Promise<TagSummary[]> {
  return drizzle(db)
    .select({ ...tagColumns, session_count: count(sessionTags.fingerprint) })
    .from(tags)
    .leftJoin(
      sessionTags,
      and(eq(sessionTags.user_id, tags.user_id), eq(sessionTags.tag_id, tags.id))
    )
    .where(eq(tags.user_id, userId))
    .groupBy(tags.id)
    .orderBy(asc(tags.name))
    .all();
}

export async function tagsBySession(
  db: D1Database,
  userId: string
): Promise<Map<string, TagRow[]>> {
  const rows = await drizzle(db)
    .select({ fingerprint: sessionTags.fingerprint, ...tagColumns })
    .from(sessionTags)
    .innerJoin(tags, and(eq(tags.user_id, sessionTags.user_id), eq(tags.id, sessionTags.tag_id)))
    .where(eq(sessionTags.user_id, userId))
    .orderBy(asc(tags.name))
    .all();
  const bySession = new Map<string, TagRow[]>();
  for (const { fingerprint, ...tag } of rows) {
    const existing = bySession.get(fingerprint);
    if (existing) existing.push(tag);
    else bySession.set(fingerprint, [tag]);
  }
  return bySession;
}

export async function getSessionTags(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<TagRow[]> {
  return drizzle(db)
    .select(tagColumns)
    .from(sessionTags)
    .innerJoin(tags, and(eq(tags.user_id, sessionTags.user_id), eq(tags.id, sessionTags.tag_id)))
    .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint)))
    .orderBy(asc(tags.name))
    .all();
}

// Notes belong to the user, not to the scoring engine, so they are written on
// their own and any owned session takes one, board-sourced history included.
export async function setSessionNotes(
  db: D1Database,
  userId: string,
  fingerprint: string,
  notes: string | null
): Promise<boolean> {
  const result = await drizzle(db)
    .update(sessions)
    .set({ notes })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
  return result.meta.changes > 0;
}

export async function setSessionTags(
  db: D1Database,
  userId: string,
  fingerprint: string,
  wanted: NormalizedTag[]
): Promise<TagRow[]> {
  const d = drizzle(db);
  const slugs = wanted.map((t) => t.slug);
  const known =
    slugs.length === 0
      ? []
      : await d
          .select(tagColumns)
          .from(tags)
          .where(and(eq(tags.user_id, userId), inArray(tags.slug, slugs)))
          .all();
  const bySlug = new Map(known.map((t) => [t.slug, t]));

  const missing = wanted.filter((t) => !bySlug.has(t.slug));
  if (missing.length > 0) {
    const created_at = new Date().toISOString();
    const created = missing.map((t) => ({ id: crypto.randomUUID(), name: t.name, slug: t.slug }));
    await d.insert(tags).values(created.map((t) => ({ user_id: userId, created_at, ...t })));
    for (const tag of created) bySlug.set(tag.slug, tag);
  }

  const linked = wanted.map((t) => bySlug.get(t.slug)!);
  const clear = d
    .delete(sessionTags)
    .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint)));
  if (linked.length === 0) await clear;
  else {
    await d.batch([
      clear,
      d
        .insert(sessionTags)
        .values(linked.map((t) => ({ user_id: userId, fingerprint, tag_id: t.id }))),
    ]);
  }
  await pruneUnusedTags(d, userId);
  return linked;
}

export type ClimbGrade =
  { scale: "v"; value: number } | { scale: "font" | "yds" | "french"; value: string };

export type ProjectRow = typeof projects.$inferSelect;

export async function listProjects(db: D1Database, userId: string): Promise<ProjectRow[]> {
  return drizzle(db).select().from(projects).where(eq(projects.user_id, userId)).all();
}

export async function upsertProject(
  db: D1Database,
  userId: string,
  project: { slug: string; name: string; grade: ClimbGrade }
): Promise<void> {
  const grade_json = JSON.stringify(project.grade);
  await drizzle(db)
    .insert(projects)
    .values({
      user_id: userId,
      slug: project.slug,
      name: project.name,
      grade_json,
      created_at: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [projects.user_id, projects.slug],
      set: { name: project.name, grade_json },
    });
}

export async function deleteProject(
  db: D1Database,
  userId: string,
  slug: string
): Promise<boolean> {
  const result = await drizzle(db)
    .delete(projects)
    .where(and(eq(projects.user_id, userId), eq(projects.slug, slug)));
  return result.meta.changes > 0;
}

export type PostableSessionRow = {
  fingerprint: string;
  source: string;
  start_at: string;
  end_at: string;
  rpe: number;
  title: string;
  summary: string;
  strava_activity_id: number | null;
};

// Its own query rather than widening sessionListColumns: summary carries the whole
// climb log, which the session list has no reason to ship for 200 rows.
export async function getSessionForPosting(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<PostableSessionRow | null> {
  const row = await drizzle(db)
    .select({
      fingerprint: sessions.fingerprint,
      source: sessions.source,
      start_at: sessions.start_at,
      end_at: sessions.end_at,
      rpe: sessions.rpe,
      title: sessions.title,
      summary: sessions.summary,
      strava_activity_id: sessions.strava_activity_id,
    })
    .from(sessions)
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)))
    .get();
  return row ?? null;
}

export async function markSessionPostPending(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<void> {
  await drizzle(db)
    .update(sessions)
    .set({ post_state: "pending", post_error: null })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
}

export async function markSessionPosted(
  db: D1Database,
  userId: string,
  fingerprint: string,
  activityId: number
): Promise<void> {
  await drizzle(db)
    .update(sessions)
    .set({
      strava_activity_id: activityId,
      posted_at: new Date().toISOString(),
      post_state: "posted",
      post_error: null,
    })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
}

export async function markSessionPostFailed(
  db: D1Database,
  userId: string,
  fingerprint: string,
  error: string
): Promise<void> {
  await drizzle(db)
    .update(sessions)
    .set({ post_state: "failed", post_error: error })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
}

export async function setStravaPosting(
  db: D1Database,
  userId: string,
  postingEnabled: boolean,
  postSince: string | null
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({ posting_enabled: postingEnabled ? 1 : 0, post_since: postSince })
    .where(eq(stravaConnections.user_id, userId));
}

export async function listSessions(
  db: D1Database,
  userId: string,
  limit: number,
  includeClimbs = false
): Promise<Array<SessionRow & { climbs_json?: string | null }>> {
  const d = drizzle(db);
  const query = includeClimbs
    ? d.select({ ...sessionListColumns, climbs_json: sessions.climbs_json }).from(sessions)
    : d.select(sessionListColumns).from(sessions);
  return query
    .where(eq(sessions.user_id, userId))
    .orderBy(desc(sessions.start_at))
    .limit(limit)
    .all();
}

export async function getSession(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<(SessionRow & { climbs_json: string | null }) | null> {
  const row = await drizzle(db)
    .select({ ...sessionListColumns, climbs_json: sessions.climbs_json })
    .from(sessions)
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)))
    .get();
  return row ?? null;
}

export async function deleteUserData(db: D1Database, userId: string): Promise<void> {
  const d = drizzle(db);
  await d.batch([
    d.delete(sessionTags).where(eq(sessionTags.user_id, userId)),
    d.delete(tags).where(eq(tags.user_id, userId)),
    d.delete(projects).where(eq(projects.user_id, userId)),
    d.delete(sessions).where(eq(sessions.user_id, userId)),
    d.delete(stravaConnections).where(eq(stravaConnections.user_id, userId)),
    d.delete(storeEntitlements).where(eq(storeEntitlements.user_id, userId)),
    // Legacy Aurora rows still hold an encrypted board token for the users who
    // connected one before the integration was discontinued. Deleting the
    // account has to take them too, ahead of the tables being dropped.
    d.delete(boardConnections).where(eq(boardConnections.user_id, userId)),
    d.delete(syncState).where(eq(syncState.user_id, userId)),
    d.delete(users).where(eq(users.id, userId)),
  ]);
}
