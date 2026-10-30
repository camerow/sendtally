-- Data-only: every exercise name the user's workouts and logged activities already
-- use gets a row, so the exercises list is complete from the first read. From here
-- on, saving a workout or an activity adds its names. Hand-written because
-- drizzle-kit diffs schema, not rows. Hangboard items name a grip, not an
-- exercise, and climbing workouts hold none, so both are left out.
INSERT OR IGNORE INTO exercises (user_id, id, name, name_key, kind, created_at, updated_at)
SELECT
  w.user_id,
  lower(hex(randomblob(16))),
  trim(json_extract(i.value, '$.exercise')),
  lower(trim(json_extract(i.value, '$.exercise'))),
  w.kind,
  w.created_at,
  w.created_at
FROM workouts w, json_each(w.variations_json) v, json_each(v.value, '$.items') i
WHERE w.kind IN ('strength', 'mobility', 'other')
  AND trim(coalesce(json_extract(i.value, '$.exercise'), '')) <> ''
ORDER BY w.created_at;
--> statement-breakpoint
INSERT OR IGNORE INTO exercises (user_id, id, name, name_key, kind, created_at, updated_at)
SELECT
  a.user_id,
  lower(hex(randomblob(16))),
  trim(json_extract(d.value, '$.exercise')),
  lower(trim(json_extract(d.value, '$.exercise'))),
  a.kind,
  a.created_at,
  a.created_at
FROM activities a, json_each(a.done_json) d
WHERE trim(coalesce(json_extract(d.value, '$.exercise'), '')) <> ''
ORDER BY a.created_at;
