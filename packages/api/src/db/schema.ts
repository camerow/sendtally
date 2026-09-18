import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  timezone: text("timezone").notNull().default("UTC"),
  created_at: text("created_at").notNull(),
  auto_sync: integer("auto_sync").notNull().default(0),
  boulder_scale: text("boulder_scale", { enum: ["v", "font"] })
    .notNull()
    .default("v"),
  route_scale: text("route_scale", { enum: ["yds", "french"] })
    .notNull()
    .default("yds"),
  role: text("role", { enum: ["user", "moderator", "admin"] })
    .notNull()
    .default("user"),
});

export const boardConnections = sqliteTable(
  "board_connections",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    board: text("board").notNull(),
    board_user_id: integer("board_user_id").notNull(),
    token_ciphertext: text("token_ciphertext").notNull(),
    status: text("status").notNull().default("active"),
    sync_since: text("sync_since"),
    connected_at: text("connected_at").notNull(),
    posting_enabled: integer("posting_enabled").notNull().default(0),
    post_since: text("post_since"),
  },
  (t) => [primaryKey({ columns: [t.user_id, t.board] })]
);

export const stravaConnections = sqliteTable("strava_connections", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => users.id),
  athlete_id: integer("athlete_id").notNull(),
  access_token_ciphertext: text("access_token_ciphertext").notNull(),
  refresh_token_ciphertext: text("refresh_token_ciphertext").notNull(),
  expires_at: integer("expires_at").notNull(),
  status: text("status").notNull().default("active"),
  connected_at: text("connected_at").notNull(),
  posting_enabled: integer("posting_enabled").notNull().default(0),
  post_since: text("post_since"),
});

export const storeEntitlements = sqliteTable(
  "store_entitlements",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    entitlement: text("entitlement").notNull(),
    store: text("store").notNull(),
    product_id: text("product_id").notNull(),
    expires_at: text("expires_at"),
    will_renew: integer("will_renew").notNull().default(1),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.user_id, t.entitlement] })]
);

export const sessions = sqliteTable(
  "sessions",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    fingerprint: text("fingerprint").notNull(),
    board: text("board"),
    source: text("source").$type<"board" | "manual">().notNull().default("board"),
    location: text("location").$type<"indoor" | "outdoor">(),
    gym_id: text("gym_id"),
    area_id: text("area_id"),
    name: text("name"),
    start_at: text("start_at").notNull(),
    end_at: text("end_at").notNull(),
    climb_count: integer("climb_count").notNull(),
    top_grade: integer("top_grade").notNull(),
    top_send_grade: integer("top_send_grade").notNull().default(-1),
    top_grade_label: text("top_grade_label"),
    top_send_grade_label: text("top_send_grade_label"),
    rpe: integer("rpe").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    climbs_json: text("climbs_json"),
    notes: text("notes"),
    strava_activity_id: integer("strava_activity_id"),
    posted_at: text("posted_at"),
    post_state: text("post_state").$type<"pending" | "posted" | "failed">(),
    post_error: text("post_error"),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.fingerprint] }),
    index("idx_sessions_user_start").on(t.user_id, t.start_at),
  ]
);

export const tags = sqliteTable(
  "tags",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    id: text("id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    created_at: text("created_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.id] }),
    uniqueIndex("idx_tags_user_slug").on(t.user_id, t.slug),
  ]
);

export const sessionTags = sqliteTable(
  "session_tags",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    fingerprint: text("fingerprint").notNull(),
    tag_id: text("tag_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.fingerprint, t.tag_id] }),
    index("idx_session_tags_user_tag").on(t.user_id, t.tag_id),
  ]
);

// One table for everything a user writes. `kind` decides which of the nullable
// columns mean anything, which is what keeps the composer one form: picking a
// kind swaps a field group, never a table.
export const journalEntries = sqliteTable(
  "journal_entries",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    id: text("id").notNull(),
    kind: text("kind", { enum: ["journal", "trip", "injury"] }).notNull(),
    occurred_at: text("occurred_at").notNull(),
    // Trips and injuries are spans. An injury with no end is still going.
    ends_at: text("ends_at"),
    title: text("title"),
    body: text("body").notNull(),
    // An injury update points at its injury. Children never appear in the log on
    // their own - they belong to the thread.
    parent_id: text("parent_id"),
    // 0-10 on an injury update. Optional: an update with no number just does not
    // plot a point.
    severity: integer("severity"),
    status: text("status", { enum: ["ongoing", "resolved"] }),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.id] }),
    index("idx_entries_user_occurred").on(t.user_id, t.occurred_at),
    index("idx_entries_user_parent").on(t.user_id, t.parent_id),
  ]
);

// The sessions an entry is about. A trip is three days of climbing and a
// reflection can cover a week, so this is a link table rather than a column.
// A deleted session takes its links, never the writing.
export const entrySessions = sqliteTable(
  "entry_sessions",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    entry_id: text("entry_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.entry_id, t.fingerprint] }),
    index("idx_entry_sessions_user_fingerprint").on(t.user_id, t.fingerprint),
  ]
);

// Entries share the user's one flat tag vocabulary with sessions. A second link
// table rather than widening session_tags: no rebuild of every existing row.
export const entryTags = sqliteTable(
  "entry_tags",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    entry_id: text("entry_id").notNull(),
    tag_id: text("tag_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.entry_id, t.tag_id] }),
    index("idx_entry_tags_user_tag").on(t.user_id, t.tag_id),
  ]
);

// A note the user wrote about one named climb in one session. It lives beside
// the session rather than inside climbs_json, so a note can be written or
// rewritten from the climb page without touching the logged climbs.
export const climbNotes = sqliteTable(
  "climb_notes",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    fingerprint: text("fingerprint").notNull(),
    climb_slug: text("climb_slug").notNull(),
    note: text("note").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.fingerprint, t.climb_slug] }),
    index("idx_climb_notes_user_climb").on(t.user_id, t.climb_slug),
  ]
);

export const gyms = sqliteTable(
  "gyms",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    scale: text("scale", { enum: ["v", "font"] })
      .notNull()
      .default("v"),
    circuits_json: text("circuits_json").notNull(),
    walls_json: text("walls_json").notNull(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [index("idx_gyms_user").on(t.user_id)]
);

export const projects = sqliteTable(
  "projects",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    grade_json: text("grade_json"),
    discipline: text("discipline", { enum: ["boulder", "route"] })
      .notNull()
      .default("boulder"),
    created_at: text("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.user_id, t.slug] })]
);

export const boardClimbNames = sqliteTable(
  "board_climb_names",
  {
    board: text("board").notNull(),
    climb_uuid: text("climb_uuid").notNull(),
    name: text("name").notNull(),
  },
  (t) => [primaryKey({ columns: [t.board, t.climb_uuid] })]
);

export const boardClimbStats = sqliteTable(
  "board_climb_stats",
  {
    board: text("board").notNull(),
    climb_uuid: text("climb_uuid").notNull(),
    angle: integer("angle").notNull(),
    display_difficulty: real("display_difficulty").notNull(),
  },
  (t) => [primaryKey({ columns: [t.board, t.climb_uuid, t.angle] })]
);

export const boardCursors = sqliteTable(
  "board_cursors",
  {
    board: text("board").notNull(),
    table_name: text("table_name").notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.board, t.table_name] })]
);

export const syncState = sqliteTable("sync_state", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => users.id),
  last_synced_at: text("last_synced_at"),
  last_error: text("last_error"),
});

const contentStatus = ["pending", "active", "merged", "deleted"] as const;

// The shared climbing tree. `path` holds the ids of every ancestor and the row
// itself, `/<region>/<area>/<self>/`, so a subtree is one indexed range scan.
export const areas = sqliteTable(
  "areas",
  {
    id: text("id").primaryKey(),
    parent_id: text("parent_id"),
    path: text("path").notNull(),
    depth: integer("depth").notNull(),
    name: text("name").notNull(),
    name_key: text("name_key").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    lat: real("lat"),
    lon: real("lon"),
    region_code: text("region_code").unique(),
    status: text("status", { enum: contentStatus }).notNull(),
    merged_into_id: text("merged_into_id"),
    version: integer("version").notNull().default(1),
    created_by: text("created_by"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [
    index("idx_areas_parent").on(t.parent_id),
    index("idx_areas_path").on(t.path),
    index("idx_areas_name_key").on(t.name_key),
    index("idx_areas_status").on(t.status),
    index("idx_areas_lat").on(t.lat),
  ]
);

export const areaClimbs = sqliteTable(
  "area_climbs",
  {
    id: text("id").primaryKey(),
    area_id: text("area_id").notNull(),
    name: text("name").notNull(),
    name_key: text("name_key").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    type: text("type", { enum: ["boulder", "sport", "trad", "top_rope"] }).notNull(),
    grade_scale: text("grade_scale", { enum: ["v", "font", "yds", "french"] }).notNull(),
    grade_value: text("grade_value"),
    length_m: integer("length_m"),
    bolts: integer("bolts"),
    first_ascent: text("first_ascent"),
    status: text("status", { enum: contentStatus }).notNull(),
    merged_into_id: text("merged_into_id"),
    version: integer("version").notNull().default(1),
    created_by: text("created_by"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [
    index("idx_area_climbs_area").on(t.area_id),
    index("idx_area_climbs_name_key").on(t.name_key),
    index("idx_area_climbs_status").on(t.status),
    index("idx_area_climbs_merged_into").on(t.merged_into_id),
  ]
);

// A logged climb, keyed the way climb_notes is, pointing at the area climb it
// is. climbs_json stays untouched.
export const sessionClimbLinks = sqliteTable(
  "session_climb_links",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    fingerprint: text("fingerprint").notNull(),
    climb_slug: text("climb_slug").notNull(),
    climb_id: text("climb_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.fingerprint, t.climb_slug] }),
    index("idx_session_climb_links_climb").on(t.climb_id),
  ]
);

const contentEntity = ["area", "climb"] as const;

export const contentRevisions = sqliteTable(
  "content_revisions",
  {
    id: text("id").primaryKey(),
    entity_type: text("entity_type", { enum: contentEntity }).notNull(),
    entity_id: text("entity_id").notNull(),
    proposed_json: text("proposed_json").notNull(),
    base_json: text("base_json").notNull(),
    change_summary: text("change_summary"),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "superseded"],
    }).notNull(),
    submitted_by: text("submitted_by"),
    reviewed_by: text("reviewed_by"),
    review_note: text("review_note"),
    reviewed_at: text("reviewed_at"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => [
    index("idx_content_revisions_entity").on(t.entity_type, t.entity_id),
    index("idx_content_revisions_status").on(t.status),
    uniqueIndex("idx_content_revisions_one_draft")
      .on(t.submitted_by, t.entity_type, t.entity_id)
      .where(sql`${t.status} = 'pending'`),
  ]
);

export const duplicateReports = sqliteTable(
  "duplicate_reports",
  {
    id: text("id").primaryKey(),
    keep_climb_id: text("keep_climb_id").notNull(),
    duplicate_climb_id: text("duplicate_climb_id").notNull(),
    reporter_id: text("reporter_id"),
    note: text("note"),
    status: text("status", { enum: ["open", "merged", "dismissed"] }).notNull(),
    reviewed_by: text("reviewed_by"),
    review_note: text("review_note"),
    created_at: text("created_at").notNull(),
    reviewed_at: text("reviewed_at"),
  },
  (t) => [
    index("idx_duplicate_reports_status").on(t.status),
    uniqueIndex("idx_duplicate_reports_open")
      .on(t.duplicate_climb_id, t.reporter_id)
      .where(sql`${t.status} = 'open'`),
  ]
);

export const contentReports = sqliteTable(
  "content_reports",
  {
    id: text("id").primaryKey(),
    entity_type: text("entity_type", { enum: contentEntity }).notNull(),
    entity_id: text("entity_id").notNull(),
    reporter_id: text("reporter_id"),
    body: text("body").notNull(),
    status: text("status", { enum: ["open", "resolved"] }).notNull(),
    reviewed_by: text("reviewed_by"),
    reviewed_at: text("reviewed_at"),
    created_at: text("created_at").notNull(),
  },
  (t) => [index("idx_content_reports_status").on(t.status)]
);
