-- Data-only: logging or saving a built-in workout used to add its exercises unlinked, so they
-- read as the user's own. A shown exercise with no link and no description of its own, named
-- like an active built-in exercise in any of its languages (the Worker's name key: trimmed,
-- A-Z lowercased), becomes that built-in's copy. Its name, kind and measure stay as they are.
WITH named (id, position, name_key) AS (
  SELECT id, position, lower(trim(name)) FROM library_items
  WHERE type = 'exercise' AND status = 'active'
  UNION ALL
  SELECT l.id, l.position, lower(trim(json_extract(t.value, '$.name')))
  FROM library_items l, json_each(l.translations) t
  WHERE l.type = 'exercise' AND l.status = 'active'
)
UPDATE exercises SET built_in = (
  SELECT id FROM named WHERE named.name_key = exercises.name_key ORDER BY position LIMIT 1
)
WHERE built_in IS NULL AND archived = 0 AND description IS NULL
  AND name_key IN (SELECT name_key FROM named);
