import { disciplineOf } from "@sendtally/core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gte,
  inArray,
  isNull,
  like,
  lt,
  lte,
  not,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  areaClimbs,
  areas,
  boardConnections,
  climbNotes,
  contentReports,
  contentRevisions,
  entrySessions,
  entryTags,
  gyms,
  journalEntries,
  projects,
  sessionClimbLinks,
  sessions,
  sessionTags,
  storeEntitlements,
  stravaConnections,
  syncState,
  tags,
  users,
} from "../db/schema";
import type { ContentEntity, Viewer } from "./areas";
import type { ClimbLink } from "./manual";
import type { EntryWrite } from "./entries";
import type { StoreEntitlement } from "./revenuecat";
import type { NormalizedTag } from "./tags";

export type UserRow = typeof users.$inferSelect;

export type StravaConnectionRow = typeof stravaConnections.$inferSelect;

// What the apps read. `summary` and `climbs_json` are the Strava description
// and the raw climb blob, which the endpoints shape themselves.
const SESSION_PRIVATE_COLUMNS = ["user_id", "summary", "climbs_json"] as const;

export type SessionRow = Omit<
  typeof sessions.$inferSelect,
  (typeof SESSION_PRIVATE_COLUMNS)[number]
>;

const sessionListColumns = Object.fromEntries(
  Object.entries(getTableColumns(sessions)).filter(
    ([name]) => !SESSION_PRIVATE_COLUMNS.includes(name as (typeof SESSION_PRIVATE_COLUMNS)[number])
  )
) as { [K in keyof SessionRow]: (typeof sessions)[K] };

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

// The scale a user reads grades in, per discipline. Stored so anywhere we show a
// grade without asking - the project dialog, a new session draft - shows theirs.
export type GradeScales = { boulder: "v" | "font"; route: "yds" | "french" };

export const DEFAULT_GRADE_SCALES: GradeScales = { boulder: "v", route: "yds" };

export function gradeScalesOf(user: UserRow | null): GradeScales {
  if (user === null) return DEFAULT_GRADE_SCALES;
  return { boulder: user.boulder_scale, route: user.route_scale };
}

export async function setGradeScales(
  db: D1Database,
  id: string,
  scales: Partial<GradeScales>
): Promise<void> {
  await drizzle(db)
    .update(users)
    .set({
      ...(scales.boulder === undefined ? {} : { boulder_scale: scales.boulder }),
      ...(scales.route === undefined ? {} : { route_scale: scales.route }),
    })
    .where(eq(users.id, id));
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
  location: "indoor" | "outdoor";
  gym_id: string | null;
  area_id: string | null;
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
};

const insertLinks = (d: Db, userId: string, fingerprint: string, links: ClimbLink[]) =>
  d.insert(sessionClimbLinks).values(links.map((l) => ({ user_id: userId, fingerprint, ...l })));

const clearLinks = (d: Db, userId: string, fingerprint: string) =>
  d
    .delete(sessionClimbLinks)
    .where(
      and(eq(sessionClimbLinks.user_id, userId), eq(sessionClimbLinks.fingerprint, fingerprint))
    );

export async function insertManualSession(
  db: D1Database,
  userId: string,
  s: ManualSessionInput,
  links: ClimbLink[] = []
): Promise<void> {
  const d = drizzle(db);
  const insert = d
    .insert(sessions)
    .values({ user_id: userId, source: "manual", board: null, ...s });
  if (links.length === 0) await insert;
  else await d.batch([insert, insertLinks(d, userId, s.fingerprint, links)]);
}

// The links are replaced whole, like the session's tags and notes.
export async function updateManualSession(
  db: D1Database,
  userId: string,
  s: ManualSessionInput,
  links: ClimbLink[]
): Promise<void> {
  const d = drizzle(db);
  const { fingerprint, ...rest } = s;
  const update = d
    .update(sessions)
    .set(rest)
    .where(
      and(
        eq(sessions.user_id, userId),
        eq(sessions.fingerprint, fingerprint),
        eq(sessions.source, "manual")
      )
    );
  const clear = clearLinks(d, userId, fingerprint);
  await (links.length === 0
    ? d.batch([update, clear])
    : d.batch([update, clear, insertLinks(d, userId, fingerprint, links)]));
}

export type SessionLinks = {
  area: { id: string; name: string; slug: string } | null;
  climbs: Map<string, { id: string; name: string; slug: string }>;
};

// Only what the viewer can still see and is still live comes back: a merge
// repoints links at the survivor, and a rejected climb drops out.
export async function getSessionLinks(
  db: D1Database,
  viewer: Viewer,
  fingerprint: string,
  areaId: string | null
): Promise<SessionLinks> {
  const d = drizzle(db);
  const open = inArray(areaClimbs.status, ["active", "pending"]);
  const [area, climbs] = await Promise.all([
    areaId === null
      ? undefined
      : d
          .select({ id: areas.id, name: areas.name, slug: areas.slug })
          .from(areas)
          .where(
            and(
              eq(areas.id, areaId),
              inArray(areas.status, ["active", "pending"]),
              visibleTo(areas, viewer)
            )
          )
          .get(),
    d
      .select({
        climb_slug: sessionClimbLinks.climb_slug,
        id: areaClimbs.id,
        name: areaClimbs.name,
        slug: areaClimbs.slug,
      })
      .from(sessionClimbLinks)
      .innerJoin(areaClimbs, eq(areaClimbs.id, sessionClimbLinks.climb_id))
      .where(
        and(
          eq(sessionClimbLinks.user_id, viewer.id),
          eq(sessionClimbLinks.fingerprint, fingerprint),
          open,
          visibleTo(areaClimbs, viewer)
        )
      )
      .all(),
  ]);
  return {
    area: area ?? null,
    climbs: new Map(climbs.map(({ climb_slug, ...climb }) => [climb_slug, climb])),
  };
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
  await d.batch([
    d
      .delete(sessionTags)
      .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint))),
    d
      .delete(climbNotes)
      .where(and(eq(climbNotes.user_id, userId), eq(climbNotes.fingerprint, fingerprint))),
    clearLinks(d, userId, fingerprint),
  ]);
  await pruneUnusedTags(d, userId);
  return true;
}

export type TagRow = { id: string; name: string; slug: string };

export type TagSummary = TagRow & { session_count: number };

type Db = ReturnType<typeof drizzle>;

const tagColumns = { id: tags.id, name: tags.name, slug: tags.slug };

// A tag exists while something wears it. Both link tables count, so a tag left
// only on an entry survives being taken off every session.
async function pruneUnusedTags(d: Db, userId: string): Promise<void> {
  const [onSessions, onEntries] = await Promise.all([
    d
      .select({ tag_id: sessionTags.tag_id })
      .from(sessionTags)
      .where(eq(sessionTags.user_id, userId))
      .all(),
    d
      .select({ tag_id: entryTags.tag_id })
      .from(entryTags)
      .where(eq(entryTags.user_id, userId))
      .all(),
  ]);
  const used = [...new Set([...onSessions, ...onEntries].map((r) => r.tag_id))];
  const unused = used.length === 0 ? undefined : notInArray(tags.id, used);
  await d.delete(tags).where(and(eq(tags.user_id, userId), unused));
}

/** Find or create the user's tags by slug. The vocabulary is shared; the links are not. */
async function ensureTags(d: Db, userId: string, wanted: NormalizedTag[]): Promise<TagRow[]> {
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

  return wanted.map((t) => bySlug.get(t.slug)!);
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

// A note belongs to the user, not to the scoring engine, so any owned session
// takes one, board-sourced history included. Storage is the journal now: the
// log form's single notes field edits the session's first entry, which is what
// the old column could hold, and creates one when there is none.
export async function upsertSessionNote(
  db: D1Database,
  userId: string,
  fingerprint: string,
  occurredAt: string,
  body: string | null
): Promise<boolean> {
  if ((await getSession(db, userId, fingerprint)) === null) return false;
  const existing = await drizzle(db)
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .innerJoin(
      entrySessions,
      and(
        eq(entrySessions.user_id, journalEntries.user_id),
        eq(entrySessions.entry_id, journalEntries.id)
      )
    )
    .where(
      and(
        eq(journalEntries.user_id, userId),
        eq(entrySessions.fingerprint, fingerprint),
        eq(journalEntries.kind, "journal"),
        // A thread update is a journal entry too, and it can be linked to a
        // session. It is not the session's note and must never be edited as one.
        isNull(journalEntries.parent_id)
      )
    )
    // The same entry `sessionResponse` reads back as `notes`, or the form would
    // show one entry and overwrite another.
    .orderBy(desc(journalEntries.occurred_at), desc(journalEntries.created_at))
    .get();

  if (existing === undefined) {
    if (body === null) return true;
    const id = crypto.randomUUID();
    await insertEntry(db, userId, id, {
      kind: "journal",
      occurred_at: occurredAt,
      ends_at: null,
      title: null,
      body,
      parent_id: null,
      severity: null,
      status: null,
    });
    await setEntrySessions(db, userId, id, [fingerprint]);
    return true;
  }

  if (body === null) await deleteEntry(db, userId, existing.id);
  else
    await drizzle(db)
      .update(journalEntries)
      .set({ body, updated_at: new Date().toISOString() })
      .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.id, existing.id)));
  return true;
}

export async function setSessionTags(
  db: D1Database,
  userId: string,
  fingerprint: string,
  wanted: NormalizedTag[]
): Promise<TagRow[]> {
  const d = drizzle(db);
  const linked = await ensureTags(d, userId, wanted);
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

export type ClimbNoteRow = typeof climbNotes.$inferSelect;

export type ClimbNoteInput = { climb_slug: string; note: string };

export async function listClimbNotes(db: D1Database, userId: string): Promise<ClimbNoteRow[]> {
  return drizzle(db).select().from(climbNotes).where(eq(climbNotes.user_id, userId)).all();
}

export async function getSessionClimbNotes(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<ClimbNoteRow[]> {
  return drizzle(db)
    .select()
    .from(climbNotes)
    .where(and(eq(climbNotes.user_id, userId), eq(climbNotes.fingerprint, fingerprint)))
    .all();
}

// The log form carries every note the user can see for that session, so saving
// it replaces the session's whole set - the same contract as its tags.
export async function setClimbNotes(
  db: D1Database,
  userId: string,
  fingerprint: string,
  notes: ClimbNoteInput[]
): Promise<void> {
  const d = drizzle(db);
  const updated_at = new Date().toISOString();
  const clear = d
    .delete(climbNotes)
    .where(and(eq(climbNotes.user_id, userId), eq(climbNotes.fingerprint, fingerprint)));
  if (notes.length === 0) {
    await clear;
    return;
  }
  await d.batch([
    clear,
    d
      .insert(climbNotes)
      .values(notes.map((n) => ({ user_id: userId, fingerprint, updated_at, ...n }))),
  ]);
}

export async function setClimbNote(
  db: D1Database,
  userId: string,
  fingerprint: string,
  climb_slug: string,
  note: string | null
): Promise<void> {
  const d = drizzle(db);
  if (note === null) {
    await d
      .delete(climbNotes)
      .where(
        and(
          eq(climbNotes.user_id, userId),
          eq(climbNotes.fingerprint, fingerprint),
          eq(climbNotes.climb_slug, climb_slug)
        )
      );
    return;
  }
  const updated_at = new Date().toISOString();
  await d
    .insert(climbNotes)
    .values({ user_id: userId, fingerprint, climb_slug, note, updated_at })
    .onConflictDoUpdate({
      target: [climbNotes.user_id, climbNotes.fingerprint, climbNotes.climb_slug],
      set: { note, updated_at },
    });
}

export async function getEntryTags(
  db: D1Database,
  userId: string,
  entryId: string
): Promise<TagRow[]> {
  return drizzle(db)
    .select(tagColumns)
    .from(entryTags)
    .innerJoin(tags, and(eq(tags.user_id, entryTags.user_id), eq(tags.id, entryTags.tag_id)))
    .where(and(eq(entryTags.user_id, userId), eq(entryTags.entry_id, entryId)))
    .orderBy(asc(tags.name))
    .all();
}

export async function tagsByEntry(db: D1Database, userId: string): Promise<Map<string, TagRow[]>> {
  const rows = await drizzle(db)
    .select({ entry_id: entryTags.entry_id, ...tagColumns })
    .from(entryTags)
    .innerJoin(tags, and(eq(tags.user_id, entryTags.user_id), eq(tags.id, entryTags.tag_id)))
    .where(eq(entryTags.user_id, userId))
    .orderBy(asc(tags.name))
    .all();
  const byEntry = new Map<string, TagRow[]>();
  for (const { entry_id, ...tag } of rows) {
    const existing = byEntry.get(entry_id);
    if (existing) existing.push(tag);
    else byEntry.set(entry_id, [tag]);
  }
  return byEntry;
}

export async function setEntryTags(
  db: D1Database,
  userId: string,
  entryId: string,
  wanted: NormalizedTag[]
): Promise<TagRow[]> {
  const d = drizzle(db);
  const linked = await ensureTags(d, userId, wanted);
  const clear = d
    .delete(entryTags)
    .where(and(eq(entryTags.user_id, userId), eq(entryTags.entry_id, entryId)));
  if (linked.length === 0) await clear;
  else {
    await d.batch([
      clear,
      d
        .insert(entryTags)
        .values(linked.map((t) => ({ user_id: userId, entry_id: entryId, tag_id: t.id }))),
    ]);
  }
  await pruneUnusedTags(d, userId);
  return linked;
}

export type EntryRow = Omit<typeof journalEntries.$inferSelect, "user_id">;

const entryColumns = Object.fromEntries(
  Object.entries(getTableColumns(journalEntries)).filter(([name]) => name !== "user_id")
) as { [K in keyof EntryRow]: (typeof journalEntries)[K] };

export async function listEntries(
  db: D1Database,
  userId: string,
  limit = 500
): Promise<EntryRow[]> {
  return drizzle(db)
    .select(entryColumns)
    .from(journalEntries)
    .where(eq(journalEntries.user_id, userId))
    .orderBy(desc(journalEntries.occurred_at), desc(journalEntries.created_at))
    .limit(limit)
    .all();
}

export async function getEntry(
  db: D1Database,
  userId: string,
  id: string
): Promise<EntryRow | null> {
  const row = await drizzle(db)
    .select(entryColumns)
    .from(journalEntries)
    .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.id, id)))
    .get();
  return row ?? null;
}

export async function getEntrySessions(
  db: D1Database,
  userId: string,
  entryId: string
): Promise<string[]> {
  const rows = await drizzle(db)
    .select({ fingerprint: entrySessions.fingerprint })
    .from(entrySessions)
    .where(and(eq(entrySessions.user_id, userId), eq(entrySessions.entry_id, entryId)))
    .all();
  return rows.map((r) => r.fingerprint);
}

export async function sessionsByEntry(
  db: D1Database,
  userId: string
): Promise<Map<string, string[]>> {
  const rows = await drizzle(db)
    .select({ entry_id: entrySessions.entry_id, fingerprint: entrySessions.fingerprint })
    .from(entrySessions)
    .where(eq(entrySessions.user_id, userId))
    .all();
  const byEntry = new Map<string, string[]>();
  for (const { entry_id, fingerprint } of rows) {
    const existing = byEntry.get(entry_id);
    if (existing) existing.push(fingerprint);
    else byEntry.set(entry_id, [fingerprint]);
  }
  return byEntry;
}

export async function setEntrySessions(
  db: D1Database,
  userId: string,
  entryId: string,
  fingerprints: string[]
): Promise<string[]> {
  const d = drizzle(db);
  // Only sessions the user owns, and each at most once.
  const owned = await d
    .select({ fingerprint: sessions.fingerprint })
    .from(sessions)
    .where(and(eq(sessions.user_id, userId), inArray(sessions.fingerprint, fingerprints)))
    .all();
  const wanted = [...new Set(owned.map((s) => s.fingerprint))];
  const clear = d
    .delete(entrySessions)
    .where(and(eq(entrySessions.user_id, userId), eq(entrySessions.entry_id, entryId)));
  if (wanted.length === 0) await clear;
  else {
    await d.batch([
      clear,
      d
        .insert(entrySessions)
        .values(wanted.map((fingerprint) => ({ user_id: userId, entry_id: entryId, fingerprint }))),
    ]);
  }
  return wanted;
}

export async function insertEntry(
  db: D1Database,
  userId: string,
  id: string,
  entry: EntryWrite
): Promise<void> {
  const now = new Date().toISOString();
  await drizzle(db)
    .insert(journalEntries)
    .values({ user_id: userId, id, ...entry, created_at: now, updated_at: now });
}

export async function updateEntry(
  db: D1Database,
  userId: string,
  id: string,
  entry: EntryWrite
): Promise<boolean> {
  const result = await drizzle(db)
    .update(journalEntries)
    .set({ ...entry, updated_at: new Date().toISOString() })
    .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.id, id)));
  return result.meta.changes > 0;
}

// Deleting a thread's parent takes its updates with it - an orphaned "felt
// better today" belongs to nothing. Deleting a session does not: see clearEntrySessions.
export async function deleteEntry(db: D1Database, userId: string, id: string): Promise<void> {
  const d = drizzle(db);
  const children = await d
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.parent_id, id)))
    .all();
  const ids = [id, ...children.map((c) => c.id)];
  await d.batch([
    d.delete(entryTags).where(and(eq(entryTags.user_id, userId), inArray(entryTags.entry_id, ids))),
    d
      .delete(entrySessions)
      .where(and(eq(entrySessions.user_id, userId), inArray(entrySessions.entry_id, ids))),
    d
      .delete(journalEntries)
      .where(and(eq(journalEntries.user_id, userId), inArray(journalEntries.id, ids))),
  ]);
  await pruneUnusedTags(d, userId);
}

// A deleted session must not destroy what the user wrote about it, so only the
// links go and the entry stands on whatever sessions it still has.
export async function unlinkSession(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<void> {
  await drizzle(db)
    .delete(entrySessions)
    .where(and(eq(entrySessions.user_id, userId), eq(entrySessions.fingerprint, fingerprint)));
}

export type Discipline = "boulder" | "route";

export type ClimbGrade =
  { scale: "v"; value: number } | { scale: "font" | "yds" | "french"; value: string };

export type ProjectRow = typeof projects.$inferSelect;

export async function listProjects(db: D1Database, userId: string): Promise<ProjectRow[]> {
  return drizzle(db).select().from(projects).where(eq(projects.user_id, userId)).all();
}

export type ProjectInput = {
  slug: string;
  name: string;
  grade?: ClimbGrade;
  discipline?: Discipline;
};

// A project row carries only what the caller supplied: the log form knows the
// grade and the projects page knows the discipline, and neither overwrites
// what the other wrote.
export async function upsertProject(
  db: D1Database,
  userId: string,
  project: ProjectInput
): Promise<void> {
  const now = new Date().toISOString();
  const grade_json = project.grade === undefined ? null : JSON.stringify(project.grade);
  const discipline =
    project.discipline ??
    (project.grade === undefined ? "boulder" : disciplineOf(project.grade.scale));
  const set: Partial<typeof projects.$inferInsert> = { name: project.name };
  if (grade_json !== null) set.grade_json = grade_json;
  if (project.discipline !== undefined || project.grade !== undefined) set.discipline = discipline;
  await drizzle(db)
    .insert(projects)
    .values({
      user_id: userId,
      slug: project.slug,
      name: project.name,
      grade_json,
      discipline,
      created_at: now,
    })
    .onConflictDoUpdate({ target: [projects.user_id, projects.slug], set });
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

export type GymRow = typeof gyms.$inferSelect;

export type GymWrite = {
  name: string;
  scale: "v" | "font";
  circuits_json: string;
  walls_json: string;
};

export async function listGyms(db: D1Database, userId: string): Promise<GymRow[]> {
  return drizzle(db)
    .select()
    .from(gyms)
    .where(eq(gyms.user_id, userId))
    .orderBy(gyms.created_at)
    .all();
}

export async function getGym(db: D1Database, userId: string, id: string): Promise<GymRow | null> {
  const row = await drizzle(db)
    .select()
    .from(gyms)
    .where(and(eq(gyms.user_id, userId), eq(gyms.id, id)))
    .get();
  return row ?? null;
}

export async function insertGym(
  db: D1Database,
  userId: string,
  id: string,
  gym: GymWrite
): Promise<void> {
  const now = new Date().toISOString();
  await drizzle(db)
    .insert(gyms)
    .values({ id, user_id: userId, ...gym, created_at: now, updated_at: now });
}

export async function updateGym(
  db: D1Database,
  userId: string,
  id: string,
  gym: GymWrite
): Promise<boolean> {
  const result = await drizzle(db)
    .update(gyms)
    .set({ ...gym, updated_at: new Date().toISOString() })
    .where(and(eq(gyms.user_id, userId), eq(gyms.id, id)));
  return result.meta.changes > 0;
}

export async function deleteGym(db: D1Database, userId: string, id: string): Promise<boolean> {
  const result = await drizzle(db)
    .delete(gyms)
    .where(and(eq(gyms.user_id, userId), eq(gyms.id, id)));
  return result.meta.changes > 0;
}

export async function deleteUserData(db: D1Database, userId: string): Promise<void> {
  const d = drizzle(db);
  await d.batch([
    d.delete(sessionTags).where(eq(sessionTags.user_id, userId)),
    d.delete(climbNotes).where(eq(climbNotes.user_id, userId)),
    d.delete(sessionClimbLinks).where(eq(sessionClimbLinks.user_id, userId)),
    d.delete(entryTags).where(eq(entryTags.user_id, userId)),
    d.delete(entrySessions).where(eq(entrySessions.user_id, userId)),
    d.delete(journalEntries).where(eq(journalEntries.user_id, userId)),
    d.delete(tags).where(eq(tags.user_id, userId)),
    d.delete(projects).where(eq(projects.user_id, userId)),
    d.delete(gyms).where(eq(gyms.user_id, userId)),
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

export type AreaRow = typeof areas.$inferSelect;

export type AreaClimbRow = typeof areaClimbs.$inferSelect;

export async function getViewer(db: D1Database, id: string): Promise<Viewer> {
  const row = await drizzle(db)
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .get();
  return { id, role: row?.role ?? "user" };
}

// The one rule for what anyone may read in Areas: live content, their own
// pending creations, and everything for moderators.
export function visibleTo(t: typeof areas | typeof areaClimbs, viewer: Viewer): SQL | undefined {
  if (viewer.role !== "user") return undefined;
  return or(eq(t.status, "active"), and(eq(t.status, "pending"), eq(t.created_by, viewer.id)));
}

// A slug read also finds merged rows, so the caller can answer with a redirect.
const visibleOrMerged = (t: typeof areas | typeof areaClimbs, viewer: Viewer): SQL | undefined => {
  const visible = visibleTo(t, viewer);
  return visible === undefined ? undefined : or(visible, eq(t.status, "merged"));
};

// A word prefix on the slugged name: "mandala" finds "the-mandala".
const nameMatches = (t: typeof areas | typeof areaClimbs, key: string): SQL | undefined =>
  or(like(t.name_key, `${key}%`), like(t.name_key, `%-${key}%`));

export type Box = { minLat: number; maxLat: number; minLon: number; maxLon: number };

const inBox = (box: Box): SQL | undefined =>
  and(
    gte(areas.lat, box.minLat),
    lte(areas.lat, box.maxLat),
    gte(areas.lon, box.minLon),
    lte(areas.lon, box.maxLon)
  );

export async function getArea(db: D1Database, viewer: Viewer, id: string): Promise<AreaRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areas)
    .where(and(eq(areas.id, id), visibleTo(areas, viewer)))
    .get();
  return row ?? null;
}

export async function getAreaBySlug(
  db: D1Database,
  viewer: Viewer,
  slug: string
): Promise<AreaRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areas)
    .where(and(eq(areas.slug, slug), visibleOrMerged(areas, viewer)))
    .get();
  return row ?? null;
}

export async function areasByIds(
  db: D1Database,
  viewer: Viewer,
  ids: string[]
): Promise<AreaRow[]> {
  if (ids.length === 0) return [];
  return drizzle(db)
    .select()
    .from(areas)
    .where(and(inArray(areas.id, ids), visibleTo(areas, viewer)))
    .orderBy(areas.depth)
    .all();
}

export async function childAreas(
  db: D1Database,
  viewer: Viewer,
  parentId: string
): Promise<AreaRow[]> {
  return drizzle(db)
    .select()
    .from(areas)
    .where(and(eq(areas.parent_id, parentId), visibleTo(areas, viewer)))
    .orderBy(areas.name_key)
    .all();
}

export async function searchAreas(
  db: D1Database,
  viewer: Viewer,
  filter: { key?: string; box?: Box },
  limit: number
): Promise<AreaRow[]> {
  return drizzle(db)
    .select()
    .from(areas)
    .where(
      and(
        visibleTo(areas, viewer),
        filter.key === undefined ? undefined : nameMatches(areas, filter.key),
        filter.box === undefined ? undefined : inBox(filter.box)
      )
    )
    .orderBy(areas.depth, areas.name_key)
    .limit(limit)
    .all();
}

export async function areaSlugTaken(db: D1Database, slug: string): Promise<boolean> {
  const row = await drizzle(db)
    .select({ id: areas.id })
    .from(areas)
    .where(eq(areas.slug, slug))
    .get();
  return row !== undefined;
}

export async function insertArea(
  db: D1Database,
  row: Omit<AreaRow, "version" | "merged_into_id" | "region_code" | "review_note">
): Promise<void> {
  await drizzle(db).insert(areas).values(row);
}

export type AreaEdit = Pick<AreaRow, "name" | "name_key" | "description" | "lat" | "lon">;

// Only the creator, only while nobody else can see it: once active, a change
// is a revision for a moderator.
export async function updatePendingArea(
  db: D1Database,
  userId: string,
  id: string,
  edit: AreaEdit
): Promise<boolean> {
  const result = await drizzle(db)
    .update(areas)
    .set({ ...edit, version: sql`${areas.version} + 1`, updated_at: new Date().toISOString() })
    .where(and(eq(areas.id, id), eq(areas.created_by, userId), eq(areas.status, "pending")));
  return result.meta.changes > 0;
}

export async function getAreaClimb(
  db: D1Database,
  viewer: Viewer,
  id: string
): Promise<AreaClimbRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(eq(areaClimbs.id, id), visibleTo(areaClimbs, viewer)))
    .get();
  return row ?? null;
}

export async function getAreaClimbBySlug(
  db: D1Database,
  viewer: Viewer,
  slug: string
): Promise<AreaClimbRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(eq(areaClimbs.slug, slug), visibleOrMerged(areaClimbs, viewer)))
    .get();
  return row ?? null;
}

export async function climbsInAreas(
  db: D1Database,
  viewer: Viewer,
  areaIds: string[]
): Promise<AreaClimbRow[]> {
  if (areaIds.length === 0) return [];
  return drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(inArray(areaClimbs.area_id, areaIds), visibleTo(areaClimbs, viewer)))
    .orderBy(areaClimbs.name_key)
    .all();
}

// `under` is an area path: the range covers exactly its subtree, because the
// character after "/" is "0".
export async function searchAreaClimbs(
  db: D1Database,
  viewer: Viewer,
  filter: { key?: string; under?: string },
  limit: number
): Promise<AreaClimbRow[]> {
  const under = filter.under;
  const subtree =
    under === undefined
      ? undefined
      : inArray(
          areaClimbs.area_id,
          drizzle(db)
            .select({ id: areas.id })
            .from(areas)
            .where(and(gte(areas.path, under), lt(areas.path, `${under.slice(0, -1)}0`)))
        );
  return drizzle(db)
    .select()
    .from(areaClimbs)
    .where(
      and(
        visibleTo(areaClimbs, viewer),
        filter.key === undefined ? undefined : nameMatches(areaClimbs, filter.key),
        subtree
      )
    )
    .orderBy(areaClimbs.name_key)
    .limit(limit)
    .all();
}

export async function areaClimbSlugTaken(db: D1Database, slug: string): Promise<boolean> {
  const row = await drizzle(db)
    .select({ id: areaClimbs.id })
    .from(areaClimbs)
    .where(eq(areaClimbs.slug, slug))
    .get();
  return row !== undefined;
}

export async function insertAreaClimb(
  db: D1Database,
  row: Omit<AreaClimbRow, "version" | "merged_into_id" | "review_note">
): Promise<void> {
  await drizzle(db).insert(areaClimbs).values(row);
}

export type AreaClimbEdit = Omit<
  AreaClimbRow,
  | "id"
  | "area_id"
  | "slug"
  | "status"
  | "merged_into_id"
  | "version"
  | "review_note"
  | "created_by"
  | "created_at"
  | "updated_at"
>;

export async function updatePendingAreaClimb(
  db: D1Database,
  userId: string,
  id: string,
  edit: AreaClimbEdit
): Promise<boolean> {
  const result = await drizzle(db)
    .update(areaClimbs)
    .set({ ...edit, version: sql`${areaClimbs.version} + 1`, updated_at: new Date().toISOString() })
    .where(
      and(
        eq(areaClimbs.id, id),
        eq(areaClimbs.created_by, userId),
        eq(areaClimbs.status, "pending")
      )
    );
  return result.meta.changes > 0;
}

export async function areaClimbsByIds(
  db: D1Database,
  viewer: Viewer,
  ids: string[]
): Promise<AreaClimbRow[]> {
  if (ids.length === 0) return [];
  return drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(inArray(areaClimbs.id, ids), visibleTo(areaClimbs, viewer)))
    .all();
}

export type RevisionRow = typeof contentRevisions.$inferSelect;

const ownDraft = (userId: string, type: ContentEntity, entityId: string): SQL | undefined =>
  and(
    eq(contentRevisions.submitted_by, userId),
    eq(contentRevisions.entity_type, type),
    eq(contentRevisions.entity_id, entityId),
    eq(contentRevisions.status, "pending")
  );

export async function getDraft(
  db: D1Database,
  userId: string,
  type: ContentEntity,
  entityId: string
): Promise<RevisionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(contentRevisions)
    .where(ownDraft(userId, type, entityId))
    .get();
  return row ?? null;
}

export type DraftWrite = Pick<
  RevisionRow,
  "submitted_by" | "entity_type" | "entity_id" | "proposed_json" | "base_json" | "change_summary"
>;

// One pending draft per user per entity, enforced by the partial unique index:
// saving again replaces it in place.
export async function saveDraft(db: D1Database, draft: DraftWrite): Promise<void> {
  const now = new Date().toISOString();
  await drizzle(db)
    .insert(contentRevisions)
    .values({
      id: crypto.randomUUID(),
      ...draft,
      status: "pending",
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: [
        contentRevisions.submitted_by,
        contentRevisions.entity_type,
        contentRevisions.entity_id,
      ],
      targetWhere: sql`${contentRevisions.status} = 'pending'`,
      set: {
        proposed_json: draft.proposed_json,
        base_json: draft.base_json,
        change_summary: draft.change_summary,
        updated_at: now,
      },
    });
}

export async function deleteDraft(
  db: D1Database,
  userId: string,
  type: ContentEntity,
  entityId: string
): Promise<boolean> {
  const result = await drizzle(db)
    .delete(contentRevisions)
    .where(ownDraft(userId, type, entityId));
  return result.meta.changes > 0;
}

export type ContentReportRow = typeof contentReports.$inferSelect;

const stamp = (): string => new Date().toISOString();

export type Page<T> = { count: number; rows: T[] };

const countOf = async (query: Promise<{ n: number }[]>): Promise<number> =>
  (await query)[0]?.n ?? 0;

export async function pendingAreas(db: D1Database, limit: number): Promise<Page<AreaRow>> {
  const d = drizzle(db);
  const pending = eq(areas.status, "pending");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(areas).where(pending)),
    d.select().from(areas).where(pending).orderBy(asc(areas.created_at)).limit(limit).all(),
  ]);
  return { count: n, rows };
}

export async function pendingAreaClimbs(
  db: D1Database,
  limit: number
): Promise<Page<AreaClimbRow>> {
  const d = drizzle(db);
  const pending = eq(areaClimbs.status, "pending");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(areaClimbs).where(pending)),
    d
      .select()
      .from(areaClimbs)
      .where(pending)
      .orderBy(asc(areaClimbs.created_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function pendingRevisions(db: D1Database, limit: number): Promise<Page<RevisionRow>> {
  const d = drizzle(db);
  const pending = eq(contentRevisions.status, "pending");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(contentRevisions).where(pending)),
    d
      .select()
      .from(contentRevisions)
      .where(pending)
      .orderBy(asc(contentRevisions.updated_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function getRevision(db: D1Database, id: string): Promise<RevisionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(contentRevisions)
    .where(eq(contentRevisions.id, id))
    .get();
  return row ?? null;
}

// An area that can hold approved content: live, and where the caller last saw it.
const liveArea = (d: Db, id: string, ...extra: (SQL | undefined)[]): SQL =>
  exists(
    d
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, id), eq(areas.status, "active"), ...extra))
  );

// Pending to active, only at the version the moderator reviewed and only once
// its parent is live, so nothing active ever hangs under something hidden.
export async function approveArea(
  db: D1Database,
  row: { id: string; version: number; parentId: string }
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areas)
    .set({ status: "active", version: sql`${areas.version} + 1`, updated_at: stamp() })
    .where(
      and(
        eq(areas.id, row.id),
        eq(areas.status, "pending"),
        eq(areas.version, row.version),
        liveArea(d, row.parentId)
      )
    );
  return result.meta.changes > 0;
}

export async function approveAreaClimb(
  db: D1Database,
  row: { id: string; version: number; areaId: string }
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areaClimbs)
    .set({ status: "active", version: sql`${areaClimbs.version} + 1`, updated_at: stamp() })
    .where(
      and(
        eq(areaClimbs.id, row.id),
        eq(areaClimbs.status, "pending"),
        eq(areaClimbs.version, row.version),
        liveArea(d, row.areaId, isNull(areas.region_code))
      )
    );
  return result.meta.changes > 0;
}

const openStatus = ["active", "pending"] as const;

// Refused while anything open still sits in the area: its children would be
// left under a deleted parent.
export async function rejectArea(
  db: D1Database,
  id: string,
  note: string | null
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areas)
    .set({ status: "deleted", review_note: note, updated_at: stamp() })
    .where(
      and(
        eq(areas.id, id),
        eq(areas.status, "pending"),
        not(
          exists(
            d
              .select({ id: areas.id })
              .from(areas)
              .where(and(eq(areas.parent_id, id), inArray(areas.status, openStatus)))
          )
        ),
        not(
          exists(
            d
              .select({ id: areaClimbs.id })
              .from(areaClimbs)
              .where(and(eq(areaClimbs.area_id, id), inArray(areaClimbs.status, openStatus)))
          )
        )
      )
    );
  return result.meta.changes > 0;
}

// The creator's sessions keep the free-text climb; only the link goes.
export async function rejectAreaClimb(
  db: D1Database,
  id: string,
  note: string | null
): Promise<boolean> {
  const d = drizzle(db);
  const [result] = await d.batch([
    d
      .update(areaClimbs)
      .set({ status: "deleted", review_note: note, updated_at: stamp() })
      .where(and(eq(areaClimbs.id, id), eq(areaClimbs.status, "pending"))),
    d.delete(sessionClimbLinks).where(
      and(
        eq(sessionClimbLinks.climb_id, id),
        exists(
          d
            .select({ id: areaClimbs.id })
            .from(areaClimbs)
            .where(and(eq(areaClimbs.id, id), eq(areaClimbs.status, "deleted")))
        )
      )
    ),
  ]);
  return result.meta.changes > 0;
}

export type AreaRevisionWrite = Pick<
  AreaRow,
  "parent_id" | "name" | "name_key" | "description" | "lat" | "lon"
>;

export type AreaClimbRevisionWrite = AreaClimbEdit & { area_id: string };

type Approval = { revisionId: string; reviewerId: string; id: string; version: number };

const revisionIs = (d: Db, id: string, status: RevisionRow["status"]): SQL =>
  exists(
    d
      .select({ id: contentRevisions.id })
      .from(contentRevisions)
      .where(and(eq(contentRevisions.id, id), eq(contentRevisions.status, status)))
  );

const markApproved = (d: Db, a: Approval, guard: SQL | undefined) =>
  d
    .update(contentRevisions)
    .set({
      status: "approved",
      reviewed_by: a.reviewerId,
      reviewed_at: stamp(),
      updated_at: stamp(),
    })
    .where(
      and(eq(contentRevisions.id, a.revisionId), eq(contentRevisions.status, "pending"), guard)
    );

// One batch, every statement guarded on the state the moderator reviewed: the
// revision flips first, only while the entity is still at `version`; the
// rest only run once it has flipped. Every approval bumps the version, so a
// competing approval fails all three together and the caller answers 409.
export async function approveAreaRevision(
  db: D1Database,
  a: Approval & {
    path: string;
    depth: number;
    parent: { id: string; path: string; depth: number };
    write: AreaRevisionWrite;
  }
): Promise<boolean> {
  const d = drizzle(db);
  const at = exists(
    d
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, a.id), eq(areas.version, a.version), eq(areas.status, "active")))
  );
  const approved = revisionIs(d, a.revisionId, "approved");
  const flip = markApproved(d, a, and(at, liveArea(d, a.parent.id, eq(areas.path, a.parent.path))));
  const update = d
    .update(areas)
    .set({ ...a.write, version: sql`${areas.version} + 1`, updated_at: stamp() })
    .where(and(eq(areas.id, a.id), eq(areas.version, a.version), approved));
  const path = `${a.parent.path}${a.id}/`;
  if (path === a.path) {
    const [, result] = await d.batch([flip, update]);
    return result.meta.changes > 0;
  }
  const move = d
    .update(areas)
    .set({
      path: sql`${path} || substr(${areas.path}, ${a.path.length + 1})`,
      depth: sql`${areas.depth} + ${a.parent.depth + 1 - a.depth}`,
    })
    .where(and(gte(areas.path, a.path), lt(areas.path, `${a.path.slice(0, -1)}0`), at, approved));
  const [, , result] = await d.batch([flip, move, update]);
  return result.meta.changes > 0;
}

export async function approveAreaClimbRevision(
  db: D1Database,
  a: Approval & { write: AreaClimbRevisionWrite }
): Promise<boolean> {
  const d = drizzle(db);
  const at = exists(
    d
      .select({ id: areaClimbs.id })
      .from(areaClimbs)
      .where(
        and(
          eq(areaClimbs.id, a.id),
          eq(areaClimbs.version, a.version),
          eq(areaClimbs.status, "active")
        )
      )
  );
  const [, result] = await d.batch([
    markApproved(d, a, and(at, liveArea(d, a.write.area_id, isNull(areas.region_code)))),
    d
      .update(areaClimbs)
      .set({ ...a.write, version: sql`${areaClimbs.version} + 1`, updated_at: stamp() })
      .where(
        and(
          eq(areaClimbs.id, a.id),
          eq(areaClimbs.version, a.version),
          revisionIs(d, a.revisionId, "approved")
        )
      ),
  ]);
  return result.meta.changes > 0;
}

export async function rejectRevision(
  db: D1Database,
  id: string,
  reviewerId: string,
  note: string | null
): Promise<boolean> {
  const result = await drizzle(db)
    .update(contentRevisions)
    .set({
      status: "rejected",
      reviewed_by: reviewerId,
      review_note: note,
      reviewed_at: stamp(),
      updated_at: stamp(),
    })
    .where(and(eq(contentRevisions.id, id), eq(contentRevisions.status, "pending")));
  return result.meta.changes > 0;
}

export async function insertContentReport(
  db: D1Database,
  report: Pick<ContentReportRow, "entity_type" | "entity_id" | "reporter_id" | "body">
): Promise<string> {
  const id = crypto.randomUUID();
  await drizzle(db)
    .insert(contentReports)
    .values({ id, ...report, status: "open", created_at: stamp() });
  return id;
}

export async function openReports(db: D1Database, limit: number): Promise<Page<ContentReportRow>> {
  const d = drizzle(db);
  const open = eq(contentReports.status, "open");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(contentReports).where(open)),
    d
      .select()
      .from(contentReports)
      .where(open)
      .orderBy(asc(contentReports.created_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function resolveReport(
  db: D1Database,
  id: string,
  reviewerId: string
): Promise<boolean> {
  const result = await drizzle(db)
    .update(contentReports)
    .set({ status: "resolved", reviewed_by: reviewerId, reviewed_at: stamp() })
    .where(and(eq(contentReports.id, id), eq(contentReports.status, "open")));
  return result.meta.changes > 0;
}
