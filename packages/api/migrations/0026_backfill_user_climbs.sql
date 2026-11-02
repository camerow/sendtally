-- Data-only: every project becomes a working climb record, and every session counts its sends.
-- Named climbs that were never a project get their record from the Worker on first read,
-- since their key is a slug SQL cannot compute.
INSERT OR IGNORE INTO user_climbs (
  user_id, id, name, name_key, discipline, grade_json, area_climb_id, working, created_at, updated_at
)
SELECT user_id, lower(hex(randomblob(16))), name, slug, discipline, grade_json, NULL, 1, created_at, created_at
FROM projects;
--> statement-breakpoint
UPDATE sessions SET send_count = (
  SELECT count(*) FROM json_each(sessions.climbs_json)
  WHERE json_extract(value, '$.kind') = 'send' AND json_type(value, '$.endurance') IS NULL
)
WHERE climbs_json IS NOT NULL;
