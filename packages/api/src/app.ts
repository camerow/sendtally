import { zValidator } from "@hono/zod-validator";
import { type Context, Hono, type MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { z } from "zod";
import { auth } from "./auth";
import type { Env } from "./bindings";
import { purgeAccount } from "./lib/account";
import {
  areaBody,
  areaClimbBody,
  areaClimbDraftBody,
  areaClimbDraftOf,
  areaClimbFieldsOf,
  areaDraftBody,
  areaDraftOf,
  areaFieldsOf,
  changesFrom,
  type ContentEntity,
  draftOf,
  type Fields,
  snapshotOf,
  areaClimbEditBody,
  areaClimbOf,
  areaClimbSimilarBody,
  areaEditBody,
  areaOf,
  areaSimilarBody,
  areaSummaryOf,
  approveRevisionBody,
  boundingBox,
  contentReportBody,
  climbWrite,
  distanceKm,
  duplicateReportBody,
  duplicatesOf,
  initialStatus,
  isOpen,
  isRegion,
  mergeBody,
  NEAR_KM,
  approvalOf,
  rejectBody,
  revisionOf,
  uniqueSlug,
  versionBody,
  bulkCreationsBody,
  moveCreationsBody,
  type Viewer,
} from "./lib/areas";
import {
  applyProjectFlags,
  climbCatalogue,
  climbNotesOf,
  climbSlug,
  projectBody,
  withClimbNotes,
} from "./lib/climbs";
import { decryptSecret, encryptSecret } from "./lib/crypto";
import { buildEntry, entryBody, overlappingTrip, type EntryWrite } from "./lib/entries";
import { exportCsv } from "./lib/export";
import { dedupedWalls, gymBody, gymOf } from "./lib/gyms";
import { importBody, importFingerprint, manualBodyOf } from "./lib/import";
import { mirrorStoreEntitlements, resolveEntitlements } from "./lib/entitlements";
import {
  buildManualSession,
  climbLinksOf,
  climbNoteBody,
  historySession,
  manualSessionBody,
  normalisedNote,
  type ManualSessionBody,
  parseClimbs,
} from "./lib/manual";
import { allowedOrigin } from "./lib/origins";
import { captureUserEvent, getPostHog, identifyUser } from "./lib/posthog";
import { syncSessionToStrava } from "./lib/posting";
import * as repo from "./lib/repo";
import { RevenueCatClient, webhookBody, webhookUserIds } from "./lib/revenuecat";
import { authorizeUrl, exchangeAuthCode, StravaUnauthorizedError } from "./lib/strava";
import { sessionTagsBody, tagSlug } from "./lib/tags";

type Vars = { userId: string; hasFeature: (feature: string) => boolean };

type AppEnv = { Bindings: Env; Variables: Vars };

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const APP_SCHEME = "sendtally";
const oauthStartQuery = z.object({ return: z.enum(["web", "app"]).default("web") });
type OAuthReturn = z.infer<typeof oauthStartQuery>["return"];

// workerd's constant-time compare. lib.dom does not declare it, and the apps
// typecheck this file for the client's response types, so it is narrowed here
// rather than declared globally.
const timingSafeEqual = (a: ArrayBufferView, b: ArrayBufferView): boolean =>
  (
    crypto.subtle as unknown as { timingSafeEqual(x: ArrayBufferView, y: ArrayBufferView): boolean }
  ).timingSafeEqual(a, b);

function sameSecret(presented: string | undefined, expected: string): boolean {
  if (presented === undefined || expected === "") return false;
  const a = new TextEncoder().encode(presented);
  const b = new TextEncoder().encode(expected);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

const revenuecat = (env: Env): RevenueCatClient =>
  new RevenueCatClient(env.REVENUECAT_SECRET_API_KEY);

// Without a distinct id posthog-node invents a random one per call, so every
// event lands on its own anonymous person. The signed-in user id is the same
// key the browser identifies with, which is what joins the two streams.
const captureEvent = async (
  c: Context<AppEnv>,
  event: string,
  properties: Record<string, string | number | boolean> = {},
  distinctId: string | undefined = c.get("userId")
): Promise<void> => {
  if (distinctId === undefined) return;
  await captureUserEvent(c.env, distinctId, event, properties);
};

const manualScoringHistory = async (
  db: D1Database,
  userId: string,
  excludeFingerprint?: string
) => {
  const rows = await repo.listSessions(db, userId, 200, true);
  return rows
    .filter((r) => r.fingerprint !== excludeFingerprint)
    .map(historySession)
    .filter((s): s is NonNullable<typeof s> => s !== null);
};

// Posting is two Strava calls plus a possible token refresh, so it runs after the
// response rather than making the user wait for it. Failures land in post_state,
// which the retry endpoint reads.
const postAfterResponse = (c: Context<AppEnv>, userId: string, fingerprint: string): void => {
  let ctx: Context<AppEnv>["executionCtx"];
  try {
    ctx = c.executionCtx;
  } catch {
    // No execution context means no background work: never start a promise that
    // would outlive the request and write after it.
    return;
  }
  ctx.waitUntil(
    syncSessionToStrava(c.env, userId, fingerprint).then(
      (result) => {
        if (result.outcome === "failed") {
          console.error(`strava post failed for ${fingerprint}: ${result.reason}`);
        }
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`strava post threw for ${fingerprint}: ${message}`);
      }
    )
  );
};

// The session's crag with the areas above it, regions left out, so the edit
// form can draw it as a path without another request.
const withTrail = async (
  db: D1Database,
  viewer: Viewer,
  area: { id: string; name: string; slug: string; path: string }
): Promise<{ id: string; name: string; slug: string; trail: { id: string; name: string }[] }> => {
  const { path, ...rest } = area;
  const above = await repo.areasByIds(
    db,
    viewer,
    areaIdsOnPath(path).filter((id) => id !== area.id)
  );
  return {
    ...rest,
    trail: above.filter((a) => a.region_code === null).map((a) => ({ id: a.id, name: a.name })),
  };
};

const sessionResponse = async (env: Env, userId: string, fingerprint: string) => {
  const row = await repo.getSession(env.DB, userId, fingerprint);
  if (row === null) return null;
  const { climbs_json, notes: _legacyNotes, ...rest } = row;
  const viewer = await repo.getViewer(env.DB, userId);
  const [tags, entries, climbNotes, links] = await Promise.all([
    repo.getSessionTags(env.DB, userId, fingerprint),
    entriesResponse(env, userId, (e) => e.fingerprints.includes(fingerprint)),
    repo.getSessionClimbNotes(env.DB, userId, fingerprint),
    repo.getSessionLinks(env.DB, viewer, fingerprint, row.area_id),
  ]);
  // `notes` is the log form's single field, now the session's first note entry.
  // Kept on the response so the session page and the edit form need no change.
  const notes = entries.find((e) => e.kind === "journal" && e.parent_id === null)?.body ?? null;
  return {
    ...rest,
    notes,
    tags,
    entries,
    area: links.area === null ? null : await withTrail(env.DB, viewer, links.area),
    climbs: withClimbNotes(parseClimbs(climbs_json), climbNotes).map((climb) => ({
      ...climb,
      link: links.climbs.get(climbSlug(climb.name.trim())) ?? null,
    })),
  };
};

// The crag must be a live, visible area below the regions, and every linked
// climb live and visible, so nobody links to someone else's pending creation.
const invalidLinks = async (
  db: D1Database,
  userId: string,
  form: ManualSessionBody
): Promise<string | null> => {
  const viewer = await repo.getViewer(db, userId);
  if (form.areaId !== undefined) {
    const area = await repo.getArea(db, viewer, form.areaId);
    if (area === null || isRegion(area) || !isOpen(area)) return "unknown area";
  }
  const ids = [...new Set(climbLinksOf(form.climbs).map((l) => l.climb_id))];
  const found = (await repo.areaClimbsByIds(db, viewer, ids)).filter(isOpen);
  return found.length === ids.length ? null : "unknown climb";
};

// One read of the user's entries, tagged, filtered in memory. There are never
// many, and the alternative is a per-entry tag query.
type EntryResponse = repo.EntryRow & { tags: repo.TagRow[]; fingerprints: string[] };

const entriesResponse = async (
  env: Env,
  userId: string,
  keep: (entry: EntryResponse) => boolean = () => true
): Promise<EntryResponse[]> => {
  const [rows, tagsByEntry, sessionsByEntry] = await Promise.all([
    repo.listEntries(env.DB, userId),
    repo.tagsByEntry(env.DB, userId),
    repo.sessionsByEntry(env.DB, userId),
  ]);
  return rows
    .map((entry) => ({
      ...entry,
      tags: tagsByEntry.get(entry.id) ?? [],
      fingerprints: sessionsByEntry.get(entry.id) ?? [],
    }))
    .filter(keep);
};

const entryResponse = async (env: Env, userId: string, id: string) => {
  const row = await repo.getEntry(env.DB, userId, id);
  if (row === null) return null;
  const [tags, fingerprints, updates] = await Promise.all([
    repo.getEntryTags(env.DB, userId, id),
    repo.getEntrySessions(env.DB, userId, id),
    entriesResponse(env, userId, (e) => e.parent_id === id),
  ]);
  // Oldest first: a thread reads as a story, unlike the log.
  updates.reverse();
  return { ...row, tags, fingerprints, updates };
};

// A 409 names the trip in the way, so a client can say which one without another read.
// Only dates being set are checked: trips that overlapped before the rule existed stay editable.
const tripOverlap = async (
  env: Env,
  userId: string,
  existing: repo.EntryRow | null,
  entry: EntryWrite
) => {
  const unchanged =
    existing !== null &&
    existing.kind === entry.kind &&
    existing.occurred_at === entry.occurred_at &&
    existing.ends_at === entry.ends_at;
  if (unchanged) return null;
  const candidate = { ...entry, id: existing?.id ?? null };
  const trip = overlappingTrip(await repo.listEntries(env.DB, userId), candidate);
  return trip === null
    ? null
    : { id: trip.id, title: trip.title, occurred_at: trip.occurred_at, ends_at: trip.ends_at };
};

// Every validated body answers the same way, so the shape a client sees for a
// rejected request does not depend on which endpoint rejected it.
const invalidBody: Parameters<typeof zValidator>[2] = (result, c) =>
  result.success ? undefined : c.json({ error: "invalid request body" }, 400);

const viewerOf = (c: Context<AppEnv>): Promise<Viewer> => repo.getViewer(c.env.DB, c.get("userId"));

type LatLon = { lat: number; lon: number };

const latLonOf = (a: { lat?: number | null; lon?: number | null }): LatLon | null =>
  a.lat == null || a.lon == null ? null : { lat: a.lat, lon: a.lon };

const areaIdsOnPath = (path: string): string[] => path.split("/").filter((id) => id !== "");

// Visible siblings, plus anything visible within a couple of kilometres: the
// same crag is often filed under two parents.
const similarAreas = async (
  db: D1Database,
  viewer: Viewer,
  parentId: string,
  name: string,
  at: LatLon | null,
  excludeId?: string
) => {
  const siblings = await repo.childAreas(db, viewer, parentId);
  const nearby =
    at === null
      ? []
      : (await repo.searchAreas(db, viewer, { box: boundingBox(at, NEAR_KM) }, 200)).filter(
          (a) =>
            a.lat !== null &&
            a.lon !== null &&
            distanceKm(at, { lat: a.lat, lon: a.lon }) <= NEAR_KM
        );
  return duplicatesOf(tagSlug(name), [...siblings, ...nearby], excludeId).map(areaSummaryOf);
};

// The target area and its sibling sectors, because boulders are often filed
// under the neighbouring one. Crags directly under a region are not
// neighbours of each other, so there the search stays in the area.
const similarClimbs = async (
  db: D1Database,
  viewer: Viewer,
  area: repo.AreaRow,
  name: string,
  excludeId?: string
) => {
  const parent = area.parent_id === null ? null : await repo.getArea(db, viewer, area.parent_id);
  const pool =
    parent === null || isRegion(parent)
      ? [area.id]
      : [area.id, ...(await repo.childAreas(db, viewer, parent.id)).map((a) => a.id)];
  const climbs = await repo.climbsInAreas(db, viewer, pool);
  return duplicatesOf(tagSlug(name), climbs, excludeId).map((row) => areaClimbOf(row, viewer));
};

// Writes only the fields that differ from the entity as it is now, and
// refreshes the base to now, so a re-edit after someone else's change diffs
// against the current state. Null when nothing differs.
const saveDraft = async (
  c: Context<AppEnv>,
  type: ContentEntity,
  row: repo.AreaRow | repo.AreaClimbRow,
  next: Fields,
  changeSummary: string | null | undefined
): Promise<repo.RevisionRow | null> => {
  const base = snapshotOf(type, row);
  const proposed = changesFrom(base, next);
  if (Object.keys(proposed).length === 0) return null;
  const userId = c.get("userId");
  await repo.ensureUser(c.env.DB, userId);
  await repo.saveDraft(c.env.DB, {
    submitted_by: userId,
    entity_type: type,
    entity_id: row.id,
    proposed_json: JSON.stringify(proposed),
    base_json: JSON.stringify(base),
    change_summary: changeSummary || null,
  });
  await captureEvent(c, "area_edit_suggested", { entity_type: type });
  return repo.getDraft(c.env.DB, userId, type, row.id);
};

const ROLE_RANK = { user: 0, moderator: 1, admin: 2 } as const;

// The one gate for moderation: mounted once on the prefix, so handlers behind
// it never check the role again.
const requireRole =
  (role: Viewer["role"]): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const viewer = await viewerOf(c);
    if (ROLE_RANK[viewer.role] < ROLE_RANK[role]) return c.json({ error: "forbidden" }, 403);
    await next();
  };

const QUEUE_PAGE = 10;
// ponytail: one page per queue, add a cursor when a queue outgrows it.
const MODERATION_LIST_LIMIT = 100;

const byCreated = (a: { created_at: string }, b: { created_at: string }): number =>
  a.created_at.localeCompare(b.created_at);

// Pending areas and climbs, oldest first, each with what it might duplicate,
// where it sits in the tree, and how its contributor's earlier work was decided.
const creationsQueue = async (db: D1Database, env: Env, viewer: Viewer, limit: number) => {
  const [areaPage, climbPage] = await Promise.all([
    repo.pendingAreas(db, limit),
    repo.pendingAreaClimbs(db, limit),
  ]);
  const idsIn = (path: string): string[] => path.split("/").filter((id) => id !== "");
  const climbAreas = await repo.areasByIds(db, viewer, [
    ...new Set(climbPage.rows.map((row) => row.area_id)),
  ]);
  const placed = [...areaPage.rows, ...climbAreas];
  const known = new Map(placed.map((row) => [row.id, row]));
  const unknown = [...new Set(placed.flatMap((row) => idsIn(row.path)))].filter(
    (id) => !known.has(id)
  );
  for (const row of await repo.areasByIds(db, viewer, unknown)) known.set(row.id, row);
  const trailOf = (area: repo.AreaRow): { id: string; name: string; slug: string }[] =>
    idsIn(area.path)
      .filter((id) => id !== area.id)
      .flatMap((id) => {
        const row = known.get(id);
        return row === undefined ? [] : [{ id: row.id, name: row.name, slug: row.slug }];
      });

  const authors = [
    ...new Set([...areaPage.rows, ...climbPage.rows].flatMap((row) => row.created_by ?? [])),
  ];
  const [records, names] = await Promise.all([
    repo.contributionRecords(db, authors),
    auth.userNames(authors, env),
  ]);
  const submitterOf = (id: string | null) =>
    id === null
      ? null
      : { id, name: names.get(id) ?? null, ...(records.get(id) ?? { approved: 0, rejected: 0 }) };

  const areaItems = await Promise.all(
    areaPage.rows.map(async (row) => ({
      entity_type: "area" as const,
      created_at: row.created_at,
      area: areaOf(row, viewer),
      trail: trailOf(row),
      submitter: submitterOf(row.created_by),
      candidates:
        row.parent_id === null
          ? []
          : (await similarAreas(db, viewer, row.parent_id, row.name, latLonOf(row), row.id)).filter(
              isOpen
            ),
    }))
  );
  const climbItems = await Promise.all(
    climbPage.rows.map(async (row) => {
      const area = known.get(row.area_id) ?? null;
      return {
        entity_type: "climb" as const,
        created_at: row.created_at,
        climb: areaClimbOf(row, viewer),
        area: area === null ? null : areaSummaryOf(area),
        trail: area === null ? [] : trailOf(area),
        submitter: submitterOf(row.created_by),
        candidates:
          area === null
            ? []
            : (await similarClimbs(db, viewer, area, row.name, row.id)).filter(isOpen),
      };
    })
  );
  return {
    count: areaPage.count + climbPage.count,
    items: [...areaItems, ...climbItems].sort(byCreated).slice(0, limit),
  };
};

const entitiesOf = async (
  db: D1Database,
  viewer: Viewer,
  refs: { entity_type: ContentEntity; entity_id: string }[]
): Promise<Map<string, repo.AreaRow | repo.AreaClimbRow>> => {
  const ids = (type: ContentEntity): string[] =>
    refs.filter((r) => r.entity_type === type).map((r) => r.entity_id);
  const [areaRows, climbRows] = await Promise.all([
    repo.areasByIds(db, viewer, ids("area")),
    repo.areaClimbsByIds(db, viewer, ids("climb")),
  ]);
  return new Map([...areaRows, ...climbRows].map((row) => [row.id, row]));
};

type Problem = { status: 404 | 409; error: string };
const missing: Problem = { status: 404, error: "not found" };
const notPending: Problem = { status: 409, error: "not pending" };
type CreationRow = repo.AreaRow | repo.AreaClimbRow;

const approveCreation = async (
  db: D1Database,
  row: CreationRow | null,
  version: number
): Promise<Problem | null> => {
  if (row === null) return missing;
  if (row.status !== "pending") return notPending;
  if ("area_id" in row) {
    return (await repo.approveAreaClimb(db, { id: row.id, version, areaId: row.area_id }))
      ? null
      : { status: 409, error: "changed since you loaded it, or its area is not live" };
  }
  if (row.parent_id === null) return missing;
  return (await repo.approveArea(db, { id: row.id, version, parentId: row.parent_id }))
    ? null
    : { status: 409, error: "changed since you loaded it, or its parent is not live" };
};

// A pending area is only rejected once nothing open is left inside it, so
// the moderator decides on each child rather than losing them silently.
const rejectCreation = async (
  db: D1Database,
  row: CreationRow | null,
  note: string | null
): Promise<Problem | null> => {
  if (row === null) return missing;
  if (row.status !== "pending") return notPending;
  if ("area_id" in row) return (await repo.rejectAreaClimb(db, row.id, note)) ? null : notPending;
  return (await repo.rejectArea(db, row.id, note))
    ? null
    : { status: 409, error: "reject or move what is inside it first" };
};

// Puts a pending creation somewhere else in the tree before it is decided.
const moveCreation = async (
  db: D1Database,
  row: CreationRow | null,
  version: number,
  parent: repo.AreaRow
): Promise<Problem | null> => {
  if (row === null) return missing;
  if (row.status !== "pending") return notPending;
  const changed: Problem = { status: 409, error: "changed since you loaded it" };
  if ("area_id" in row) {
    if (isRegion(parent)) return { status: 409, error: "a climb cannot sit directly in a region" };
    return (await repo.movePendingAreaClimb(db, { id: row.id, version, areaId: parent.id }))
      ? null
      : changed;
  }
  if (parent.path.startsWith(row.path)) {
    return { status: 409, error: "an area cannot move inside itself" };
  }
  if (isRegion(parent) && latLonOf(row) === null) {
    return { status: 409, error: "an area directly under a region needs coordinates" };
  }
  const moved = await repo.movePendingArea(db, {
    id: row.id,
    version,
    path: row.path,
    depth: row.depth,
    parent: { id: parent.id, path: parent.path, depth: parent.depth },
  });
  return moved ? null : changed;
};

const revisionsQueue = async (db: D1Database, viewer: Viewer, limit: number) => {
  const page = await repo.pendingRevisions(db, limit);
  const entities = await entitiesOf(db, viewer, page.rows);
  return {
    count: page.count,
    items: page.rows.map((row) => revisionOf(row, entities.get(row.entity_id) ?? null)),
  };
};

const reportsQueue = async (db: D1Database, viewer: Viewer, limit: number) => {
  const page = await repo.openReports(db, limit);
  const entities = await entitiesOf(db, viewer, page.rows);
  return {
    count: page.count,
    items: page.rows.map((row) => {
      const entity = entities.get(row.entity_id);
      return {
        id: row.id,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        entity:
          entity === undefined
            ? null
            : { name: entity.name, slug: entity.slug, status: entity.status },
        body: row.body,
        created_at: row.created_at,
      };
    }),
  };
};

const duplicatesQueue = async (db: D1Database, viewer: Viewer, limit: number) => {
  const page = await repo.openDuplicateReports(db, limit);
  const ids = page.rows.flatMap((r) => [r.keep_climb_id, r.duplicate_climb_id]);
  const [rows, links] = await Promise.all([
    repo.areaClimbsByIds(db, viewer, ids),
    repo.linkCounts(db, ids),
  ]);
  const climbs = new Map(rows.map((row) => [row.id, row]));
  const side = (id: string) => {
    const row = climbs.get(id);
    return row === undefined ? null : { ...areaClimbOf(row, viewer), links: links.get(id) ?? 0 };
  };
  return {
    count: page.count,
    items: page.rows.map((row) => ({
      id: row.id,
      keep: side(row.keep_climb_id),
      duplicate: side(row.duplicate_climb_id),
      note: row.note,
      created_at: row.created_at,
    })),
  };
};

const mergeClimbs = async (
  c: Context<AppEnv>,
  m: { duplicateId: string; keepId: string },
  source: "report" | "direct"
) => {
  const merged = await repo.mergeAreaClimb(c.env.DB, { ...m, reviewerId: c.get("userId") });
  if (!merged) return c.json({ error: "one of the climbs changed since you loaded it" }, 409);
  await captureEvent(c, "moderation_duplicate_merged", { source });
  const viewer = await viewerOf(c);
  const survivor = await repo.getAreaClimb(c.env.DB, viewer, m.keepId);
  return c.json({ climb: survivor === null ? null : areaClimbOf(survivor, viewer) });
};

const areaSearchQuery = z.object({
  q: z.string().trim().max(80).optional(),
  within: z.string().min(1).max(80).optional(),
  near: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .transform((s) => {
      const [lat, lon] = s.split(",").map(Number);
      return { lat: lat ?? 0, lon: lon ?? 0 };
    })
    .refine((p) => Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180)
    .optional(),
});

const areaClimbSearchQuery = z.object({
  q: z.string().trim().max(80).optional(),
  areaId: z.string().min(1).optional(),
});

const AREA_SEARCH_LIMIT = 20;
const AREA_NEARBY_KM = 50;

const gradeScalesBody = z.object({
  boulder: z.enum(["v", "font"]).optional(),
  route: z.enum(["yds", "french"]).optional(),
});

const stravaPostingBody = z.object({
  enabled: z.boolean(),
  since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
});

const app = new Hono<AppEnv>()
  .get("/health", (c) => c.json({ ok: true }))

  .get("/webhooks/strava", (c) => {
    if (c.req.query("hub.verify_token") !== c.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      return c.json({ error: "bad verify token" }, 403);
    }
    return c.json({ "hub.challenge": c.req.query("hub.challenge") ?? "" });
  })

  .post("/webhooks/strava", async (c) => {
    const event = (await c.req.json()) as {
      object_type?: string;
      object_id?: number;
      aspect_type?: string;
      updates?: Record<string, string>;
    };
    if (
      event.object_type === "athlete" &&
      event.aspect_type === "update" &&
      event.updates?.["authorized"] === "false" &&
      typeof event.object_id === "number"
    ) {
      await repo.markStravaConnectionDeadByAthlete(c.env.DB, event.object_id);
    }
    return c.json({ ok: true });
  })

  .post("/webhooks/clerk", async (c) => {
    let event;
    try {
      event = await auth.verifyWebhook(c.req.raw, c.env);
    } catch (err) {
      console.error(`clerk webhook rejected: ${err instanceof Error ? err.message : String(err)}`);
      return c.json({ error: "bad signature" }, 400);
    }
    // Covers deletions we did not initiate - Clerk's account portal and the
    // Clerk dashboard both land here, and they would otherwise orphan the
    // user's D1 rows and leave their Strava grant live.
    if (event.type === "user.deleted" && event.userId !== null) {
      await purgeAccount(c.env, event.userId);
    }
    // Clerk owns account creation on both web and mobile, so its webhook is the
    // one place that sees every signup exactly once, with the email attached.
    if (event.type === "user.created" && event.userId !== null) {
      if (event.email !== null) {
        await identifyUser(c.env, event.userId, { email: event.email });
      }
      await captureEvent(c, "account_created", {}, event.userId);
    }
    return c.json({ ok: true });
  })

  // Every event re-reads the subscriber from RevenueCat instead of trusting
  // the event body, so retries and out-of-order delivery converge on the same
  // rows. A failed mirror returns 500 on purpose: RevenueCat retries those.
  // Parsed by hand rather than through zValidator: nothing types this route, and
  // zValidator would start requiring a JSON Content-Type from a third party whose
  // headers we do not control. The secret is still checked before the body is read.
  .post("/webhooks/revenuecat", async (c) => {
    if (!sameSecret(c.req.header("Authorization"), c.env.REVENUECAT_WEBHOOK_AUTH)) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const parsed = webhookBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid request body" }, 400);
    for (const userId of webhookUserIds(parsed.data.event)) {
      await mirrorStoreEntitlements(c.env, revenuecat(c.env), userId);
    }
    return c.json({ ok: true });
  })

  .get("/connect/strava/callback", async (c) => {
    const code = c.req.query("code");
    const stateRaw = c.req.query("state");
    if (code === undefined || stateRaw === undefined) {
      return c.json({ error: "missing code or state" }, 400);
    }
    let state: { userId: string; nonce: string; exp: number; return?: OAuthReturn };
    try {
      state = JSON.parse(await decryptSecret(stateRaw, c.env.TOKEN_KEY)) as typeof state;
    } catch {
      return c.json({ error: "bad state" }, 400);
    }
    if (Date.now() > state.exp) return c.json({ error: "state expired" }, 400);
    c.set("userId", state.userId);
    // Soft browser binding: the web flow carries the nonce cookie and must match;
    // the mobile flow authorizes in the system browser, which never saw the cookie.
    const cookieNonce = getCookie(c, "st_oauth");
    if (cookieNonce !== undefined && cookieNonce !== state.nonce) {
      return c.json({ error: "bad state" }, 400);
    }
    deleteCookie(c, "st_oauth", { path: "/connect/strava" });

    let exchanged;
    try {
      exchanged = await exchangeAuthCode(
        { clientId: c.env.STRAVA_CLIENT_ID, clientSecret: c.env.STRAVA_CLIENT_SECRET },
        code
      );
    } catch (err) {
      if (err instanceof StravaUnauthorizedError) {
        return c.json({ error: "strava rejected the authorization code" }, 422);
      }
      throw err;
    }
    await repo.ensureUser(c.env.DB, state.userId);
    await repo.upsertStravaConnection(c.env.DB, {
      user_id: state.userId,
      athlete_id: exchanged.athleteId,
      access_token_ciphertext: await encryptSecret(exchanged.tokens.accessToken, c.env.TOKEN_KEY),
      refresh_token_ciphertext: await encryptSecret(exchanged.tokens.refreshToken, c.env.TOKEN_KEY),
      expires_at: exchanged.tokens.expiresAt,
    });
    await captureEvent(c, "strava_connection_completed", {}, state.userId);
    return c.redirect(
      state.return === "app"
        ? `${APP_SCHEME}://connected/strava`
        : `${c.env.WEB_APP_URL}/connected/strava`
    );
  })

  .use("/v1/*", (c, next) =>
    cors({
      origin: (origin) => allowedOrigin(origin, c.env.WEB_APP_URL, c.env.PREVIEW_ORIGIN_SUFFIX),
      allowHeaders: [
        "Authorization",
        "Content-Type",
        "X-POSTHOG-DISTINCT-ID",
        "X-POSTHOG-SESSION-ID",
      ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })(c, next)
  )

  .use("/v1/*", async (c, next) => {
    const user = await auth.verifyUser(c.req.raw, c.env);
    if (user === null) return c.json({ error: "unauthorized" }, 401);
    c.set("userId", user.userId);
    c.set("hasFeature", user.hasFeature);

    const posthog = getPostHog(c.env);
    if (posthog === null) return next();

    return posthog.withContext(
      {
        distinctId: user.userId,
        sessionId: c.req.header("X-POSTHOG-SESSION-ID"),
      },
      next
    );
  })

  .get("/v1/connect/strava/start", zValidator("query", oauthStartQuery, invalidBody), async (c) => {
    const userId = c.get("userId");
    const { return: returnTo } = c.req.valid("query");
    const nonce = crypto.randomUUID();
    setCookie(c, "st_oauth", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: OAUTH_STATE_TTL_MS / 1000,
      path: "/connect/strava",
    });
    const state = await encryptSecret(
      JSON.stringify({ userId, nonce, exp: Date.now() + OAUTH_STATE_TTL_MS, return: returnTo }),
      c.env.TOKEN_KEY
    );
    const redirectUri = new URL("/connect/strava/callback", c.req.url).toString();
    const url = authorizeUrl(
      { clientId: c.env.STRAVA_CLIENT_ID, clientSecret: c.env.STRAVA_CLIENT_SECRET },
      redirectUri,
      state
    );
    await captureEvent(c, "strava_connection_started", {});
    return c.json({ url });
  })

  .get("/v1/sessions", async (c) => {
    const userId = c.get("userId");
    const includeClimbs = c.req.query("include") === "climbs";
    const [rows, tagsBySession, notes] = await Promise.all([
      repo.listSessions(c.env.DB, userId, 200, includeClimbs),
      repo.tagsBySession(c.env.DB, userId),
      includeClimbs ? repo.listClimbNotes(c.env.DB, userId) : [],
    ]);
    const notesBySession = new Map<string, repo.ClimbNoteRow[]>();
    for (const note of notes) {
      const list = notesBySession.get(note.fingerprint);
      if (list === undefined) notesBySession.set(note.fingerprint, [note]);
      else list.push(note);
    }
    const sessions = rows.map(({ climbs_json, ...rest }) => ({
      ...rest,
      tags: tagsBySession.get(rest.fingerprint) ?? [],
      climbs: includeClimbs
        ? withClimbNotes(parseClimbs(climbs_json), notesBySession.get(rest.fingerprint) ?? [])
        : undefined,
    }));
    return c.json({ sessions });
  })

  .get("/v1/entries", async (c) => {
    return c.json({ entries: await entriesResponse(c.env, c.get("userId")) });
  })

  .post("/v1/entries", zValidator("json", entryBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const entry = buildEntry(form);
    const overlap = await tripOverlap(c.env, userId, null, entry);
    if (overlap !== null) return c.json({ error: "trip dates overlap", trip: overlap }, 409);
    const id = crypto.randomUUID();
    await repo.insertEntry(c.env.DB, userId, id, entry);
    if (form.tags !== undefined) await repo.setEntryTags(c.env.DB, userId, id, form.tags);
    const linked = await repo.setEntrySessions(c.env.DB, userId, id, form.fingerprints ?? []);
    await captureEvent(c, "journal_entry_created", {
      entry_kind: form.kind,
      session_count: String(linked.length),
    });
    return c.json({ entry: await entryResponse(c.env, userId, id) }, 201);
  })

  .get("/v1/entries/:id", async (c) => {
    const entry = await entryResponse(c.env, c.get("userId"), c.req.param("id"));
    if (entry === null) return c.json({ error: "not found" }, 404);
    return c.json({ entry });
  })

  .put("/v1/entries/:id", zValidator("json", entryBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const entry = buildEntry(form);
    const existing = await repo.getEntry(c.env.DB, userId, id);
    if (existing === null) return c.json({ error: "not found" }, 404);
    const overlap = await tripOverlap(c.env, userId, existing, entry);
    if (overlap !== null) return c.json({ error: "trip dates overlap", trip: overlap }, 409);
    const updated = await repo.updateEntry(c.env.DB, userId, id, entry);
    if (!updated) return c.json({ error: "not found" }, 404);
    await repo.setEntryTags(c.env.DB, userId, id, form.tags ?? []);
    await repo.setEntrySessions(c.env.DB, userId, id, form.fingerprints ?? []);
    await captureEvent(c, "journal_entry_updated", { entry_kind: form.kind });
    return c.json({ entry: await entryResponse(c.env, userId, id) });
  })

  .delete("/v1/entries/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const existing = await repo.getEntry(c.env.DB, userId, id);
    if (existing === null) return c.json({ error: "not found" }, 404);
    await repo.deleteEntry(c.env.DB, userId, id);
    await captureEvent(c, "journal_entry_deleted", { entry_kind: existing.kind });
    return c.json({ deleted: true });
  })

  .get("/v1/tags", async (c) => {
    return c.json({ tags: await repo.listTags(c.env.DB, c.get("userId")) });
  })

  // Every named climb the user has logged, with a project flag. Stats come
  // from the session rows on read, so edits and deletions never leave a
  // project count stale.
  .get("/v1/climbs", async (c) => {
    const userId = c.get("userId");
    const [rows, projects] = await Promise.all([
      repo.listSessions(c.env.DB, userId, 5000, true),
      repo.listProjects(c.env.DB, userId),
    ]);
    return c.json({ climbs: climbCatalogue(rows, projects) });
  })

  // Marking a project from the projects page rather than the log form: the
  // name is the identity, so re-posting an existing one updates it in place.
  .post("/v1/projects", zValidator("json", projectBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const name = form.name.trim();
    const slug = climbSlug(name);
    if (slug === "") return c.json({ error: "invalid request body" }, 400);
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    await repo.upsertProject(c.env.DB, userId, {
      slug,
      name,
      ...(form.discipline === undefined ? {} : { discipline: form.discipline }),
      ...(form.grade === undefined ? {} : { grade: form.grade }),
    });
    await captureEvent(c, "project_marked", { source: "projects" });
    return c.json({ slug });
  })

  .delete("/v1/projects/:slug", async (c) => {
    const deleted = await repo.deleteProject(c.env.DB, c.get("userId"), c.req.param("slug"));
    if (!deleted) return c.json({ error: "not found" }, 404);
    await captureEvent(c, "project_unmarked", {});
    return c.json({ deleted: true });
  })

  // A gym is the user's own: its circuits (colour, label, grade range) and the
  // walls they log against. Stored whole, edited whole.
  .get("/v1/gyms", async (c) => {
    const rows = await repo.listGyms(c.env.DB, c.get("userId"));
    return c.json({ gyms: rows.map(gymOf) });
  })

  .post("/v1/gyms", zValidator("json", gymBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const id = crypto.randomUUID();
    await repo.insertGym(c.env.DB, userId, id, {
      name: form.name,
      scale: form.scale,
      circuits_json: JSON.stringify(form.circuits),
      walls_json: JSON.stringify(dedupedWalls(form.walls)),
    });
    await captureEvent(c, "gym_created", { circuits: String(form.circuits.length) });
    const row = await repo.getGym(c.env.DB, userId, id);
    return c.json({ gym: row === null ? null : gymOf(row) }, 201);
  })

  .put("/v1/gyms/:id", zValidator("json", gymBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const updated = await repo.updateGym(c.env.DB, userId, id, {
      name: form.name,
      scale: form.scale,
      circuits_json: JSON.stringify(form.circuits),
      walls_json: JSON.stringify(dedupedWalls(form.walls)),
    });
    if (!updated) return c.json({ error: "not found" }, 404);
    const row = await repo.getGym(c.env.DB, userId, id);
    return c.json({ gym: row === null ? null : gymOf(row) });
  })

  // Sessions logged at the gym keep their circuit snapshots and gym_id; only
  // the gym record itself goes.
  .delete("/v1/gyms/:id", async (c) => {
    const deleted = await repo.deleteGym(c.env.DB, c.get("userId"), c.req.param("id"));
    if (!deleted) return c.json({ error: "not found" }, 404);
    return c.json({ deleted: true });
  })

  // Areas: the shared tree of regions, crags and sectors, and the climbs in
  // them. Everything a user creates starts pending and is visible only to them
  // (and moderators) until approved.
  // `within` is the area already picked: what is inside it comes first, so the
  // next level down is one keystroke away, and the rest of the tree follows.
  // Every hit carries its ancestors, which is what draws it as a path.
  .get("/v1/areas", zValidator("query", areaSearchQuery, invalidBody), async (c) => {
    const { q, near, within } = c.req.valid("query");
    const key = q === undefined ? "" : tagSlug(q);
    const viewer = await viewerOf(c);
    const inside = within === undefined ? null : await repo.getArea(c.env.DB, viewer, within);
    if (key === "" && near === undefined && inside === null) return c.json({ areas: [] });
    const [insideRows, rows] = await Promise.all([
      inside === null
        ? []
        : repo.searchAreas(
            c.env.DB,
            viewer,
            { ...(key === "" ? {} : { key }), under: inside.path },
            AREA_SEARCH_LIMIT
          ),
      key === "" && near === undefined
        ? []
        : repo.searchAreas(
            c.env.DB,
            viewer,
            key === "" ? { box: boundingBox(near ?? { lat: 0, lon: 0 }, AREA_NEARBY_KM) } : { key },
            near === undefined ? AREA_SEARCH_LIMIT : 200
          ),
    ]);
    const distance = (a: repo.AreaRow): number =>
      near === undefined || a.lat === null || a.lon === null
        ? Infinity
        : distanceKm(near, { lat: a.lat, lon: a.lon });
    const ranked = near === undefined ? rows : rows.sort((a, b) => distance(a) - distance(b));
    const seen = new Set<string>(insideRows.map((a) => a.id));
    const hits = [...insideRows, ...ranked.filter((a) => !seen.has(a.id) && seen.add(a.id))].slice(
      0,
      AREA_SEARCH_LIMIT
    );
    const ancestorIds = [
      ...new Set(hits.flatMap((a) => areaIdsOnPath(a.path).filter((id) => id !== a.id))),
    ];
    const ancestors = new Map(
      (await repo.areasByIds(c.env.DB, viewer, ancestorIds)).map((a) => [a.id, areaSummaryOf(a)])
    );
    return c.json({
      areas: hits.map((a) => ({
        ...areaSummaryOf(a),
        ancestors: areaIdsOnPath(a.path)
          .filter((id) => id !== a.id)
          .flatMap((id) => ancestors.get(id) ?? []),
      })),
    });
  })

  .post("/v1/areas/similar", zValidator("json", areaSimilarBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const viewer = await viewerOf(c);
    return c.json({
      candidates: await similarAreas(c.env.DB, viewer, form.parentId, form.name, latLonOf(form)),
    });
  })

  .get("/v1/areas/:slug", async (c) => {
    const viewer = await viewerOf(c);
    const row = await repo.getAreaBySlug(c.env.DB, viewer, c.req.param("slug"));
    if (row === null) return c.json({ error: "not found" }, 404);
    if (row.status === "merged") {
      const target =
        row.merged_into_id === null
          ? null
          : await repo.getArea(c.env.DB, viewer, row.merged_into_id);
      if (target === null) return c.json({ error: "not found" }, 404);
      return c.json({ redirect: target.slug });
    }
    const [ancestors, children, climbs] = await Promise.all([
      repo.areasByIds(
        c.env.DB,
        viewer,
        areaIdsOnPath(row.path).filter((id) => id !== row.id)
      ),
      repo.childAreas(c.env.DB, viewer, row.id),
      repo.climbsInAreas(c.env.DB, viewer, [row.id]),
    ]);
    return c.json({
      area: areaOf(row, viewer),
      ancestors: ancestors.map(areaSummaryOf),
      children: children.map(areaSummaryOf),
      climbs: climbs.map((climb) => areaClimbOf(climb, viewer)),
    });
  })

  // Regions are seeded, never created here: every created area has a parent,
  // and one directly under a region has to say where it is.
  .post("/v1/areas", zValidator("json", areaBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const viewer = await viewerOf(c);
    const parent = await repo.getArea(c.env.DB, viewer, form.parentId);
    if (parent === null || !isOpen(parent)) {
      return c.json({ error: "parent area not found" }, 400);
    }
    const at = latLonOf(form);
    if (isRegion(parent) && at === null) {
      return c.json({ error: "an area directly under a region needs coordinates" }, 400);
    }
    if (!form.confirmedNew) {
      const candidates = await similarAreas(c.env.DB, viewer, parent.id, form.name, at);
      if (candidates.length > 0) return c.json({ error: "possible duplicates", candidates }, 409);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await repo.insertArea(c.env.DB, {
      id,
      parent_id: parent.id,
      path: `${parent.path}${id}/`,
      depth: parent.depth + 1,
      name: form.name,
      name_key: tagSlug(form.name),
      slug: await uniqueSlug(form.name, parent.slug, (slug) => repo.areaSlugTaken(c.env.DB, slug)),
      description: form.description || null,
      lat: at?.lat ?? null,
      lon: at?.lon ?? null,
      status: initialStatus(viewer),
      created_by: userId,
      created_at: now,
      updated_at: now,
    });
    await captureEvent(c, "area_created", { under_region: isRegion(parent) });
    const row = await repo.getArea(c.env.DB, viewer, id);
    return c.json({ area: row === null ? null : areaOf(row, viewer) }, 201);
  })

  .put("/v1/areas/:id", zValidator("json", areaEditBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const viewer = await viewerOf(c);
    const id = c.req.param("id");
    const row = await repo.getArea(c.env.DB, viewer, id);
    if (row === null) return c.json({ error: "not found" }, 404);
    if (row.status !== "pending" || row.created_by !== viewer.id) {
      return c.json({ error: "only your own pending area can be edited directly" }, 403);
    }
    const parent =
      row.parent_id === null ? null : await repo.getArea(c.env.DB, viewer, row.parent_id);
    const at = latLonOf(form);
    if (parent !== null && isRegion(parent) && at === null) {
      return c.json({ error: "an area directly under a region needs coordinates" }, 400);
    }
    await repo.updatePendingArea(c.env.DB, viewer.id, id, {
      name: form.name,
      name_key: tagSlug(form.name),
      description: form.description || null,
      lat: at?.lat ?? null,
      lon: at?.lon ?? null,
    });
    const updated = await repo.getArea(c.env.DB, viewer, id);
    return c.json({ area: updated === null ? null : areaOf(updated, viewer) });
  })

  .get("/v1/area-climbs", zValidator("query", areaClimbSearchQuery, invalidBody), async (c) => {
    const { q, areaId } = c.req.valid("query");
    const key = q === undefined ? "" : tagSlug(q);
    if (key === "" && areaId === undefined) return c.json({ climbs: [] });
    const viewer = await viewerOf(c);
    const area = areaId === undefined ? null : await repo.getArea(c.env.DB, viewer, areaId);
    if (areaId !== undefined && area === null) return c.json({ error: "not found" }, 404);
    const rows = await repo.searchAreaClimbs(
      c.env.DB,
      viewer,
      {
        ...(key === "" ? {} : { key }),
        ...(area === null ? {} : { under: area.path }),
      },
      50
    );
    return c.json({ climbs: rows.map((row) => areaClimbOf(row, viewer)) });
  })

  .post(
    "/v1/area-climbs/similar",
    zValidator("json", areaClimbSimilarBody, invalidBody),
    async (c) => {
      const form = c.req.valid("json");
      const viewer = await viewerOf(c);
      const area = await repo.getArea(c.env.DB, viewer, form.areaId);
      if (area === null) return c.json({ error: "not found" }, 404);
      return c.json({ candidates: await similarClimbs(c.env.DB, viewer, area, form.name) });
    }
  )

  .get("/v1/area-climbs/:slug", async (c) => {
    const viewer = await viewerOf(c);
    const row = await repo.getAreaClimbBySlug(c.env.DB, viewer, c.req.param("slug"));
    if (row === null) return c.json({ error: "not found" }, 404);
    if (row.status === "merged") {
      const target =
        row.merged_into_id === null
          ? null
          : await repo.getAreaClimb(c.env.DB, viewer, row.merged_into_id);
      if (target === null) return c.json({ error: "not found" }, 404);
      return c.json({ redirect: target.slug });
    }
    const area = await repo.getArea(c.env.DB, viewer, row.area_id);
    const ancestors =
      area === null ? [] : await repo.areasByIds(c.env.DB, viewer, areaIdsOnPath(area.path));
    const logged = await repo.sessionsOnClimb(c.env.DB, viewer.id, row.id);
    return c.json({
      climb: areaClimbOf(row, viewer),
      ancestors: ancestors.map(areaSummaryOf),
      sessions: logged.map(({ climb_slug, climbs_json, ...session }) => ({
        ...session,
        sent: parseClimbs(climbs_json).some(
          (climb) => climb.kind === "send" && climbSlug(climb.name.trim()) === climb_slug
        ),
      })),
    });
  })

  .post("/v1/area-climbs", zValidator("json", areaClimbBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const viewer = await viewerOf(c);
    const area = await repo.getArea(c.env.DB, viewer, form.areaId);
    if (area === null || !isOpen(area)) return c.json({ error: "area not found" }, 400);
    if (isRegion(area)) return c.json({ error: "a climb cannot sit directly in a region" }, 400);
    if (!form.confirmedNew) {
      const candidates = await similarClimbs(c.env.DB, viewer, area, form.name);
      if (candidates.length > 0) return c.json({ error: "possible duplicates", candidates }, 409);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await repo.insertAreaClimb(c.env.DB, {
      id,
      area_id: area.id,
      ...climbWrite(form),
      slug: await uniqueSlug(form.name, area.slug, (slug) =>
        repo.areaClimbSlugTaken(c.env.DB, slug)
      ),
      status: initialStatus(viewer),
      created_by: userId,
      created_at: now,
      updated_at: now,
    });
    await captureEvent(c, "area_climb_created", { type: form.type });
    const row = await repo.getAreaClimb(c.env.DB, viewer, id);
    return c.json({ climb: row === null ? null : areaClimbOf(row, viewer) }, 201);
  })

  .put("/v1/area-climbs/:id", zValidator("json", areaClimbEditBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const viewer = await viewerOf(c);
    const id = c.req.param("id");
    const row = await repo.getAreaClimb(c.env.DB, viewer, id);
    if (row === null) return c.json({ error: "not found" }, 404);
    if (row.status !== "pending" || row.created_by !== viewer.id) {
      return c.json({ error: "only your own pending climb can be edited directly" }, 403);
    }
    await repo.updatePendingAreaClimb(c.env.DB, viewer.id, id, climbWrite(form));
    const updated = await repo.getAreaClimb(c.env.DB, viewer, id);
    return c.json({ climb: updated === null ? null : areaClimbOf(updated, viewer) });
  })

  // Suggested edits: a pending revision per user per active entity, never a
  // write to the entity itself. A pending entity is edited in place instead.
  .get("/v1/areas/:id/draft", async (c) => {
    const viewer = await viewerOf(c);
    const row = await repo.getArea(c.env.DB, viewer, c.req.param("id"));
    if (row === null) return c.json({ error: "not found" }, 404);
    const draft = await repo.getDraft(c.env.DB, viewer.id, "area", row.id);
    return c.json({ draft: draft === null ? null : draftOf(draft) });
  })

  .put("/v1/areas/:id/draft", zValidator("json", areaDraftBody, invalidBody), async (c) => {
    const { changeSummary, ...form } = c.req.valid("json");
    const viewer = await viewerOf(c);
    const row = await repo.getArea(c.env.DB, viewer, c.req.param("id"));
    if (row === null) return c.json({ error: "not found" }, 404);
    if (row.status !== "active" || isRegion(row)) {
      return c.json({ error: "only an active area takes suggested edits" }, 409);
    }
    const next = areaDraftOf(row, form);
    if (next === null) return c.json({ error: "invalid request body" }, 400);
    const parent = await repo.getArea(c.env.DB, viewer, next.parentId);
    if (parent === null || !isOpen(parent) || parent.path.startsWith(row.path)) {
      return c.json({ error: "parent area not found" }, 400);
    }
    if (isRegion(parent) && latLonOf(next) === null) {
      return c.json({ error: "an area directly under a region needs coordinates" }, 400);
    }
    const draft = await saveDraft(c, "area", row, areaFieldsOf(next), changeSummary);
    if (draft === null) return c.json({ error: "no changes" }, 400);
    return c.json({ draft: draftOf(draft) });
  })

  .delete("/v1/areas/:id/draft", async (c) => {
    const viewer = await viewerOf(c);
    const row = await repo.getArea(c.env.DB, viewer, c.req.param("id"));
    if (row === null) return c.json({ error: "not found" }, 404);
    const deleted = await repo.deleteDraft(c.env.DB, viewer.id, "area", row.id);
    return deleted ? c.json({ ok: true }) : c.json({ error: "not found" }, 404);
  })

  .get("/v1/area-climbs/:id/draft", async (c) => {
    const viewer = await viewerOf(c);
    const row = await repo.getAreaClimb(c.env.DB, viewer, c.req.param("id"));
    if (row === null) return c.json({ error: "not found" }, 404);
    const draft = await repo.getDraft(c.env.DB, viewer.id, "climb", row.id);
    return c.json({ draft: draft === null ? null : draftOf(draft) });
  })

  .put(
    "/v1/area-climbs/:id/draft",
    zValidator("json", areaClimbDraftBody, invalidBody),
    async (c) => {
      const { changeSummary, ...form } = c.req.valid("json");
      const viewer = await viewerOf(c);
      const row = await repo.getAreaClimb(c.env.DB, viewer, c.req.param("id"));
      if (row === null) return c.json({ error: "not found" }, 404);
      if (row.status !== "active") {
        return c.json({ error: "only an active climb takes suggested edits" }, 409);
      }
      const next = areaClimbDraftOf(row, form);
      if (next === null) return c.json({ error: "invalid request body" }, 400);
      const area = await repo.getArea(c.env.DB, viewer, next.areaId);
      if (area === null || !isOpen(area) || isRegion(area)) {
        return c.json({ error: "area not found" }, 400);
      }
      const draft = await saveDraft(c, "climb", row, areaClimbFieldsOf(next), changeSummary);
      if (draft === null) return c.json({ error: "no changes" }, 400);
      return c.json({ draft: draftOf(draft) });
    }
  )

  .delete("/v1/area-climbs/:id/draft", async (c) => {
    const viewer = await viewerOf(c);
    const row = await repo.getAreaClimb(c.env.DB, viewer, c.req.param("id"));
    if (row === null) return c.json({ error: "not found" }, 404);
    const deleted = await repo.deleteDraft(c.env.DB, viewer.id, "climb", row.id);
    return deleted ? c.json({ ok: true }) : c.json({ error: "not found" }, 404);
  })

  .post(
    "/v1/area-climbs/:id/duplicate-reports",
    zValidator("json", duplicateReportBody, invalidBody),
    async (c) => {
      const form = c.req.valid("json");
      const viewer = await viewerOf(c);
      const [duplicate, keep] = await Promise.all([
        repo.getAreaClimb(c.env.DB, viewer, c.req.param("id")),
        repo.getAreaClimb(c.env.DB, viewer, form.keepClimbId),
      ]);
      if (duplicate === null || keep === null || !isOpen(duplicate) || !isOpen(keep)) {
        return c.json({ error: "not found" }, 404);
      }
      if (duplicate.id === keep.id)
        return c.json({ error: "a climb cannot duplicate itself" }, 400);
      await repo.ensureUser(c.env.DB, viewer.id);
      const id = await repo.insertDuplicateReport(c.env.DB, {
        keep_climb_id: keep.id,
        duplicate_climb_id: duplicate.id,
        reporter_id: viewer.id,
        note: form.note || null,
      });
      if (id === null) return c.json({ error: "already reported" }, 409);
      await captureEvent(c, "area_duplicate_reported");
      return c.json({ report: { id } }, 201);
    }
  )

  .post("/v1/areas/reports", zValidator("json", contentReportBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const viewer = await viewerOf(c);
    const entity =
      form.entityType === "area"
        ? await repo.getArea(c.env.DB, viewer, form.entityId)
        : await repo.getAreaClimb(c.env.DB, viewer, form.entityId);
    if (entity === null) return c.json({ error: "not found" }, 404);
    await repo.ensureUser(c.env.DB, viewer.id);
    const id = await repo.insertContentReport(c.env.DB, {
      entity_type: form.entityType,
      entity_id: entity.id,
      reporter_id: viewer.id,
      body: form.body,
    });
    await captureEvent(c, "area_issue_reported", { entity_type: form.entityType });
    return c.json({ report: { id } }, 201);
  })

  // Moderation: everything below the gate is for moderators and admins only.
  .use("/v1/moderation/*", requireRole("moderator"))

  .get("/v1/moderation/queue", async (c) => {
    const viewer = await viewerOf(c);
    const [creations, revisions, duplicates, reports] = await Promise.all([
      creationsQueue(c.env.DB, c.env, viewer, QUEUE_PAGE),
      revisionsQueue(c.env.DB, viewer, QUEUE_PAGE),
      duplicatesQueue(c.env.DB, viewer, QUEUE_PAGE),
      reportsQueue(c.env.DB, viewer, QUEUE_PAGE),
    ]);
    return c.json({ creations, revisions, duplicates, reports });
  })

  .get("/v1/moderation/creations", async (c) =>
    c.json(await creationsQueue(c.env.DB, c.env, await viewerOf(c), MODERATION_LIST_LIMIT))
  )

  .post(
    "/v1/moderation/areas/:id/approve",
    zValidator("json", versionBody, invalidBody),
    async (c) => {
      const viewer = await viewerOf(c);
      const row = await repo.getArea(c.env.DB, viewer, c.req.param("id"));
      const problem = await approveCreation(c.env.DB, row, c.req.valid("json").version);
      if (problem !== null) return c.json({ error: problem.error }, problem.status);
      await captureEvent(c, "moderation_creation_approved", { entity_type: "area" });
      const updated = await repo.getArea(c.env.DB, viewer, c.req.param("id"));
      return c.json({ area: updated === null ? null : areaOf(updated, viewer) });
    }
  )

  .post(
    "/v1/moderation/climbs/:id/approve",
    zValidator("json", versionBody, invalidBody),
    async (c) => {
      const viewer = await viewerOf(c);
      const row = await repo.getAreaClimb(c.env.DB, viewer, c.req.param("id"));
      const problem = await approveCreation(c.env.DB, row, c.req.valid("json").version);
      if (problem !== null) return c.json({ error: problem.error }, problem.status);
      await captureEvent(c, "moderation_creation_approved", { entity_type: "climb" });
      const updated = await repo.getAreaClimb(c.env.DB, viewer, c.req.param("id"));
      return c.json({ climb: updated === null ? null : areaClimbOf(updated, viewer) });
    }
  )

  .post(
    "/v1/moderation/areas/:id/reject",
    zValidator("json", rejectBody, invalidBody),
    async (c) => {
      const row = await repo.getArea(c.env.DB, await viewerOf(c), c.req.param("id"));
      const problem = await rejectCreation(c.env.DB, row, c.req.valid("json").note || null);
      if (problem !== null) return c.json({ error: problem.error }, problem.status);
      await captureEvent(c, "moderation_creation_rejected", { entity_type: "area" });
      return c.json({ ok: true });
    }
  )

  .post(
    "/v1/moderation/climbs/:id/reject",
    zValidator("json", rejectBody, invalidBody),
    async (c) => {
      const row = await repo.getAreaClimb(c.env.DB, await viewerOf(c), c.req.param("id"));
      const problem = await rejectCreation(c.env.DB, row, c.req.valid("json").note || null);
      if (problem !== null) return c.json({ error: problem.error }, problem.status);
      await captureEvent(c, "moderation_creation_rejected", { entity_type: "climb" });
      return c.json({ ok: true });
    }
  )

  // Approving works down the tree and rejecting works up it, so a selection
  // that holds an area and what is inside it goes through in one request.
  // Each item answers for itself: one that changed is skipped, not fatal.
  .post(
    "/v1/moderation/creations/bulk",
    zValidator("json", bulkCreationsBody, invalidBody),
    async (c) => {
      const { action, note, items } = c.req.valid("json");
      const rows = await entitiesOf(
        c.env.DB,
        await viewerOf(c),
        items.map((item) => ({ entity_type: item.entity_type, entity_id: item.id }))
      );
      const rowOf = (item: (typeof items)[number]): CreationRow | null => {
        const row = rows.get(item.id);
        return row !== undefined && "area_id" in row === (item.entity_type === "climb")
          ? row
          : null;
      };
      const depthOf = (item: (typeof items)[number]): number => {
        const row = rowOf(item);
        return row !== null && "depth" in row ? row.depth : Infinity;
      };
      const ordered = [...items].sort((a, b) => depthOf(a) - depthOf(b));
      if (action === "reject") ordered.reverse();
      const results: { id: string; entity_type: "area" | "climb"; error: string | null }[] = [];
      for (const item of ordered) {
        const problem =
          action === "approve"
            ? await approveCreation(c.env.DB, rowOf(item), item.version)
            : await rejectCreation(c.env.DB, rowOf(item), note || null);
        results.push({ id: item.id, entity_type: item.entity_type, error: problem?.error ?? null });
      }
      const done = results.filter((r) => r.error === null).length;
      await captureEvent(c, "moderation_creations_bulk", {
        action,
        done,
        skipped: results.length - done,
      });
      return c.json({ results });
    }
  )

  .post(
    "/v1/moderation/creations/move",
    zValidator("json", moveCreationsBody, invalidBody),
    async (c) => {
      const { parentId, items } = c.req.valid("json");
      const viewer = await viewerOf(c);
      const [parent, rows] = await Promise.all([
        repo.getArea(c.env.DB, viewer, parentId),
        entitiesOf(
          c.env.DB,
          viewer,
          items.map((item) => ({ entity_type: item.entity_type, entity_id: item.id }))
        ),
      ]);
      if (parent === null || !isOpen(parent)) return c.json({ error: "not found" }, 404);
      const results: { id: string; entity_type: "area" | "climb"; error: string | null }[] = [];
      for (const item of items) {
        const row = rows.get(item.id);
        const typed =
          row !== undefined && "area_id" in row === (item.entity_type === "climb") ? row : null;
        const problem = await moveCreation(c.env.DB, typed, item.version, parent);
        results.push({ id: item.id, entity_type: item.entity_type, error: problem?.error ?? null });
      }
      await captureEvent(c, "moderation_creations_moved", {
        moved: results.filter((r) => r.error === null).length,
      });
      return c.json({ results });
    }
  )

  .get("/v1/moderation/revisions", async (c) =>
    c.json(await revisionsQueue(c.env.DB, await viewerOf(c), MODERATION_LIST_LIMIT))
  )

  // Applies the three-way result in one guarded batch. A re-parent is placed
  // by the same rules as creation, checked again now rather than trusted from
  // when the edit was suggested.
  .post(
    "/v1/moderation/revisions/:id/approve",
    zValidator("json", approveRevisionBody, invalidBody),
    async (c) => {
      const { version, resolutions } = c.req.valid("json");
      const viewer = await viewerOf(c);
      const revision = await repo.getRevision(c.env.DB, c.req.param("id"));
      if (revision === null || revision.status !== "pending") {
        return c.json({ error: "not found" }, 404);
      }
      const { proposed } = draftOf(revision);
      if (Object.keys(resolutions).some((field) => !Object.hasOwn(proposed, field))) {
        return c.json({ error: "resolutions only apply to proposed fields" }, 400);
      }
      const approval = { revisionId: revision.id, reviewerId: viewer.id, version };
      const resolved = Object.keys(resolutions).length > 0;
      const placement = { error: "the new place is no longer valid" };

      if (revision.entity_type === "area") {
        const found = approvalOf(
          await repo.getArea(c.env.DB, viewer, revision.entity_id),
          revision,
          version,
          resolutions
        );
        if ("problem" in found) return c.json(found.problem, 409);
        const { entity, apply } = found;
        const next = areaDraftOf({ ...entity, ...apply }, {});
        if (next === null) return c.json({ error: "invalid request body" }, 400);
        const parent = await repo.getArea(c.env.DB, viewer, next.parentId);
        if (
          parent === null ||
          parent.status !== "active" ||
          parent.path.startsWith(entity.path) ||
          (isRegion(parent) && latLonOf(next) === null)
        ) {
          return c.json(placement, 409);
        }
        const approved = await repo.approveAreaRevision(c.env.DB, {
          ...approval,
          id: entity.id,
          path: entity.path,
          depth: entity.depth,
          parent: { id: parent.id, path: parent.path, depth: parent.depth },
          write: { ...areaFieldsOf(next), name_key: tagSlug(next.name) },
        });
        if (!approved) return c.json({ error: "changed since you loaded it" }, 409);
        await captureEvent(c, "moderation_revision_approved", { entity_type: "area", resolved });
        const updated = await repo.getArea(c.env.DB, viewer, entity.id);
        return c.json({ area: updated === null ? null : areaOf(updated, viewer) });
      }

      const found = approvalOf(
        await repo.getAreaClimb(c.env.DB, viewer, revision.entity_id),
        revision,
        version,
        resolutions
      );
      if ("problem" in found) return c.json(found.problem, 409);
      const { entity, apply } = found;
      const next = areaClimbDraftOf({ ...entity, ...apply }, {});
      if (next === null) return c.json({ error: "invalid request body" }, 400);
      const area = await repo.getArea(c.env.DB, viewer, next.areaId);
      if (area === null || area.status !== "active" || isRegion(area)) {
        return c.json(placement, 409);
      }
      const approved = await repo.approveAreaClimbRevision(c.env.DB, {
        ...approval,
        id: entity.id,
        write: { area_id: area.id, ...climbWrite(next) },
      });
      if (!approved) return c.json({ error: "changed since you loaded it" }, 409);
      await captureEvent(c, "moderation_revision_approved", { entity_type: "climb", resolved });
      const updated = await repo.getAreaClimb(c.env.DB, viewer, entity.id);
      return c.json({ climb: updated === null ? null : areaClimbOf(updated, viewer) });
    }
  )

  .post(
    "/v1/moderation/revisions/:id/reject",
    zValidator("json", rejectBody, invalidBody),
    async (c) => {
      const revision = await repo.getRevision(c.env.DB, c.req.param("id"));
      if (revision === null) return c.json({ error: "not found" }, 404);
      const rejected = await repo.rejectRevision(
        c.env.DB,
        revision.id,
        c.get("userId"),
        c.req.valid("json").note || null
      );
      if (!rejected) return c.json({ error: "not pending" }, 409);
      await captureEvent(c, "moderation_revision_rejected", {
        entity_type: revision.entity_type,
      });
      return c.json({ ok: true });
    }
  )

  .get("/v1/moderation/duplicates", async (c) =>
    c.json(await duplicatesQueue(c.env.DB, await viewerOf(c), MODERATION_LIST_LIMIT))
  )

  .post(
    "/v1/moderation/duplicates/:id/merge",
    zValidator("json", mergeBody, invalidBody),
    async (c) => {
      const report = await repo.getDuplicateReport(c.env.DB, c.req.param("id"));
      if (report === null) return c.json({ error: "not found" }, 404);
      if (report.status !== "open") return c.json({ error: "not open" }, 409);
      const swap = c.req.valid("json").swap;
      return mergeClimbs(
        c,
        {
          keepId: swap ? report.duplicate_climb_id : report.keep_climb_id,
          duplicateId: swap ? report.keep_climb_id : report.duplicate_climb_id,
        },
        "report"
      );
    }
  )

  .post(
    "/v1/moderation/duplicates/:id/dismiss",
    zValidator("json", rejectBody, invalidBody),
    async (c) => {
      const dismissed = await repo.dismissDuplicateReport(
        c.env.DB,
        c.req.param("id"),
        c.get("userId"),
        c.req.valid("json").note || null
      );
      if (!dismissed) return c.json({ error: "not found" }, 404);
      await captureEvent(c, "moderation_duplicate_dismissed");
      return c.json({ ok: true });
    }
  )

  .post("/v1/moderation/climbs/:id/merge-into/:keepId", async (c) => {
    const viewer = await viewerOf(c);
    const [duplicate, keep] = await Promise.all([
      repo.getAreaClimb(c.env.DB, viewer, c.req.param("id")),
      repo.getAreaClimb(c.env.DB, viewer, c.req.param("keepId")),
    ]);
    if (duplicate === null || keep === null) return c.json({ error: "not found" }, 404);
    if (duplicate.id === keep.id) return c.json({ error: "a climb cannot duplicate itself" }, 400);
    return mergeClimbs(c, { duplicateId: duplicate.id, keepId: keep.id }, "direct");
  })

  .get("/v1/moderation/reports", async (c) =>
    c.json(await reportsQueue(c.env.DB, await viewerOf(c), MODERATION_LIST_LIMIT))
  )

  .post("/v1/moderation/reports/:id/resolve", async (c) => {
    if (!(await repo.resolveReport(c.env.DB, c.req.param("id"), c.get("userId")))) {
      return c.json({ error: "not found" }, 404);
    }
    await captureEvent(c, "moderation_report_resolved");
    return c.json({ ok: true });
  })

  .get("/v1/sessions/:fingerprint", async (c) => {
    const session = await sessionResponse(c.env, c.get("userId"), c.req.param("fingerprint"));
    if (session === null) return c.json({ error: "not found" }, 404);
    return c.json({ session });
  })

  .post("/v1/sessions", zValidator("json", manualSessionBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const invalid = await invalidLinks(c.env.DB, userId, form);
    if (invalid !== null) return c.json({ error: invalid }, 400);
    const fingerprint = `manual-${crypto.randomUUID()}`;
    const history = await manualScoringHistory(c.env.DB, userId);
    const input = buildManualSession(fingerprint, form, history);
    await repo.insertManualSession(c.env.DB, userId, input, climbLinksOf(form.climbs));
    await repo.upsertSessionNote(
      c.env.DB,
      userId,
      fingerprint,
      form.date,
      normalisedNote(form.notes)
    );
    if (form.tags !== undefined) {
      await repo.setSessionTags(c.env.DB, userId, fingerprint, form.tags);
    }
    await applyProjectFlags(c.env.DB, userId, form.climbs);
    await repo.setClimbNotes(c.env.DB, userId, fingerprint, climbNotesOf(form.climbs));
    await captureEvent(c, "manual_session_created", { session_source: "manual" });
    const body = { session: await sessionResponse(c.env, userId, fingerprint) };
    postAfterResponse(c, userId, fingerprint);
    return c.json(body, 201);
  })

  // A batch of sessions from a CSV. Scored oldest first so each one sees the
  // ones before it as history, and skipped when its fingerprint is already
  // there, so a file imported twice adds nothing. Never posted to Strava.
  .post("/v1/sessions/import", zValidator("json", importBody, invalidBody), async (c) => {
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const gymIdByName = new Map(
      (await repo.listGyms(c.env.DB, userId)).map((g) => [g.name.toLowerCase(), g.id])
    );
    const history = await manualScoringHistory(c.env.DB, userId);
    const ordered = [...c.req.valid("json").sessions].sort((a, b) => a.date.localeCompare(b.date));
    let imported = 0;
    let skipped = 0;
    for (const session of ordered) {
      const fingerprint = await importFingerprint(session);
      if ((await repo.getSession(c.env.DB, userId, fingerprint)) !== null) {
        skipped++;
        continue;
      }
      const form = manualBodyOf(session, gymIdByName);
      const input = buildManualSession(fingerprint, form, history);
      await repo.insertManualSession(c.env.DB, userId, input);
      await repo.upsertSessionNote(
        c.env.DB,
        userId,
        fingerprint,
        form.date,
        normalisedNote(form.notes)
      );
      if (form.tags !== undefined)
        await repo.setSessionTags(c.env.DB, userId, fingerprint, form.tags);
      await repo.setClimbNotes(c.env.DB, userId, fingerprint, climbNotesOf(form.climbs));
      const scored = historySession(input);
      if (scored !== null) history.push(scored);
      imported++;
    }
    await captureEvent(c, "sessions_imported", {
      imported: String(imported),
      skipped: String(skipped),
    });
    return c.json({ imported, skipped }, 201);
  })

  // Everything the user logged, one row per climb, in the importer's format.
  .get("/v1/export.csv", async (c) => {
    const userId = c.get("userId");
    const [sessions, tagsBySession, climbNotes, gyms, entries] = await Promise.all([
      repo.listSessions(c.env.DB, userId, 5000, true),
      repo.tagsBySession(c.env.DB, userId),
      repo.listClimbNotes(c.env.DB, userId),
      repo.listGyms(c.env.DB, userId),
      entriesResponse(c.env, userId, (e) => e.kind === "journal" && e.parent_id === null),
    ]);
    const notesBySession = new Map<string, string>();
    for (const e of entries) {
      for (const fp of e.fingerprints) if (!notesBySession.has(fp)) notesBySession.set(fp, e.body);
    }
    await captureEvent(c, "sessions_exported", { session_count: String(sessions.length) });
    return c.body(exportCsv({ sessions, tagsBySession, notesBySession, climbNotes, gyms }), 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sendtally-export.csv"',
    });
  })

  .put(
    "/v1/sessions/:fingerprint",
    zValidator("json", manualSessionBody, invalidBody),
    async (c) => {
      const form = c.req.valid("json");
      const userId = c.get("userId");
      const fingerprint = c.req.param("fingerprint");
      const existing = await repo.getSession(c.env.DB, userId, fingerprint);
      if (existing === null) return c.json({ error: "not found" }, 404);
      if (existing.source !== "manual") {
        return c.json({ error: "only manually logged sessions can be edited" }, 409);
      }
      const invalid = await invalidLinks(c.env.DB, userId, form);
      if (invalid !== null) return c.json({ error: invalid }, 400);
      const history = await manualScoringHistory(c.env.DB, userId, fingerprint);
      const input = buildManualSession(fingerprint, form, history);
      await repo.updateManualSession(c.env.DB, userId, input, climbLinksOf(form.climbs));
      await repo.upsertSessionNote(
        c.env.DB,
        userId,
        fingerprint,
        form.date,
        normalisedNote(form.notes)
      );
      await repo.setSessionTags(c.env.DB, userId, fingerprint, form.tags ?? []);
      await applyProjectFlags(c.env.DB, userId, form.climbs);
      await repo.setClimbNotes(c.env.DB, userId, fingerprint, climbNotesOf(form.climbs));
      await captureEvent(c, "manual_session_updated", { session_source: "manual" });
      const body = { session: await sessionResponse(c.env, userId, fingerprint) };
      // Already posted sessions get the activity patched, never a second one.
      postAfterResponse(c, userId, fingerprint);
      return c.json(body);
    }
  )

  .post("/v1/sessions/:fingerprint/strava", async (c) => {
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    if ((await repo.getSession(c.env.DB, userId, fingerprint)) === null) {
      return c.json({ error: "not found" }, 404);
    }
    const result = await syncSessionToStrava(c.env, userId, fingerprint, true);
    if (result.outcome === "failed") {
      return c.json({ outcome: result.outcome, reason: result.reason }, 502);
    }
    await captureEvent(c, "strava_post_retried", { outcome: result.outcome });
    return c.json({
      outcome: result.outcome,
      reason: result.reason,
      session: await sessionResponse(c.env, userId, fingerprint),
    });
  })

  // A climb note is the user's own writing too, and it lives beside the session
  // rather than in it, so board rows take one and nothing is re-scored. The
  // climb is addressed by its slug, which is what the notes roll up under.
  .put(
    "/v1/sessions/:fingerprint/climbs/:slug/note",
    zValidator("json", climbNoteBody, invalidBody),
    async (c) => {
      const userId = c.get("userId");
      const fingerprint = c.req.param("fingerprint");
      const slug = climbSlug(c.req.param("slug"));
      if (slug === "") return c.json({ error: "invalid request body" }, 400);
      if ((await repo.getSession(c.env.DB, userId, fingerprint)) === null) {
        return c.json({ error: "not found" }, 404);
      }
      const note = normalisedNote(c.req.valid("json").note);
      await repo.setClimbNote(c.env.DB, userId, fingerprint, slug, note);
      await captureEvent(c, "climb_note_updated", { cleared: String(note === null) });
      return c.json({ note });
    }
  )

  // Tags live in their own tables, so legacy board sessions stay taggable
  // without writing to those read-only rows.
  .put(
    "/v1/sessions/:fingerprint/tags",
    zValidator("json", sessionTagsBody, invalidBody),
    async (c) => {
      const userId = c.get("userId");
      const fingerprint = c.req.param("fingerprint");
      if ((await repo.getSession(c.env.DB, userId, fingerprint)) === null) {
        return c.json({ error: "not found" }, 404);
      }
      const tags = await repo.setSessionTags(
        c.env.DB,
        userId,
        fingerprint,
        c.req.valid("json").tags
      );
      await captureEvent(c, "session_tags_updated", { tag_count: String(tags.length) });
      return c.json({ tags });
    }
  )

  .delete("/v1/sessions/:fingerprint", async (c) => {
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    const existing = await repo.getSession(c.env.DB, userId, fingerprint);
    if (existing === null) return c.json({ error: "not found" }, 404);
    await repo.deleteSession(c.env.DB, userId, fingerprint);
    await repo.unlinkSession(c.env.DB, userId, fingerprint);
    await captureEvent(c, "manual_session_deleted", { session_source: existing.source });
    return c.json({ deleted: true });
  })

  .get("/v1/status", async (c) => {
    const userId = c.get("userId");
    const [strava, user] = await Promise.all([
      repo.getStravaConnection(c.env.DB, userId),
      repo.getUser(c.env.DB, userId),
    ]);
    const scales = repo.gradeScalesOf(user);
    return c.json({
      gradeScales: { boulder: scales.boulder, route: scales.route },
      role: user?.role ?? "user",
      strava:
        strava === null
          ? null
          : {
              athleteId: strava.athlete_id,
              status: strava.status,
              postingEnabled: strava.posting_enabled === 1,
              postSince: strava.post_since,
            },
    });
  })

  .get("/v1/entitlements", async (c) => {
    const user = { userId: c.get("userId"), hasFeature: c.get("hasFeature") };
    return c.json(await resolveEntitlements(c.env, user));
  })

  // Called by the app right after a purchase or restore, so the answer does not
  // wait on the webhook.
  .post("/v1/entitlements/refresh", async (c) => {
    const user = { userId: c.get("userId"), hasFeature: c.get("hasFeature") };
    await mirrorStoreEntitlements(c.env, revenuecat(c.env), user.userId);
    await captureEvent(c, "entitlements_refreshed", {});
    return c.json(await resolveEntitlements(c.env, user));
  })

  .put(
    "/v1/preferences/grade-scales",
    zValidator("json", gradeScalesBody, invalidBody),
    async (c) => {
      const userId = c.get("userId");
      await repo.ensureUser(c.env.DB, userId);
      await repo.setGradeScales(c.env.DB, userId, c.req.valid("json"));
      const scales = repo.gradeScalesOf(await repo.getUser(c.env.DB, userId));
      await captureEvent(c, "grade_scales_updated", scales);
      return c.json({ gradeScales: scales });
    }
  )

  .put(
    "/v1/connections/strava/posting",
    zValidator("json", stravaPostingBody, invalidBody),
    async (c) => {
      const form = c.req.valid("json");
      const userId = c.get("userId");
      const strava = await repo.getStravaConnection(c.env.DB, userId);
      if (strava === null) return c.json({ error: "strava not connected" }, 409);
      const since =
        form.since === undefined || form.since === null ? null : `${form.since}T00:00:00Z`;
      await repo.setStravaPosting(c.env.DB, userId, form.enabled, since);
      await captureEvent(c, "strava_posting_updated", { enabled: form.enabled });
      return c.json({ postingEnabled: form.enabled, postSince: since });
    }
  )

  .delete("/v1/account", async (c) => {
    const userId = c.get("userId");
    await purgeAccount(c.env, userId);
    try {
      await auth.deleteUser(userId, c.env);
    } catch (err) {
      console.error(
        `clerk user deletion failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return c.json({ error: "account data deleted but sign-in could not be removed" }, 502);
    }
    return c.json({ deleted: true });
  });

app.onError(async (error, c) => {
  // zValidator throws this for a body it cannot parse at all. Without this the
  // catch-all below would answer 500 and log a false exception for what is a
  // malformed request, and RevenueCat would retry a payload that can never work.
  if (error instanceof HTTPException) {
    return c.json(
      { error: error.status === 400 ? "invalid request body" : error.message },
      error.status
    );
  }
  console.error(error);
  const posthog = getPostHog(c.env);
  if (posthog !== null) {
    posthog.captureException(error, c.get("userId"));
    await posthog.flush();
  }
  return c.json({ error: "internal server error" }, 500);
});

export type AppType = typeof app;

export type { ProjectInput } from "./lib/climbs";

export type { LogClimbInput, LogSessionInput } from "./lib/manual";
export type { ImportBody } from "./lib/import";

export { app };

export type { Circuit, CircuitColour, Gym, GymInput } from "./lib/gyms";
export type { Area, AreaClimb, AreaClimbInput, AreaHit, AreaInput, AreaSummary } from "./lib/areas";
export { CIRCUIT_COLOURS, circuitMiddle, circuitRangeLabel } from "./lib/gyms";
