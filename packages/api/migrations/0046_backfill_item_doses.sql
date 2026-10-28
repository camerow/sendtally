-- Data-only: alternating moves from whole variations onto single items. Each item of
-- the first variation takes the doses every variation gives it, in variation order, so
-- a variation index becomes the item's dose index and week changes keep their meaning.
-- A dose no variation changes is kept once. Variations whose exercises do not line up
-- item by item keep the first variation only. The next migration drops what this one
-- copied out of.
UPDATE workouts
SET items_json = CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM json_each(workouts.variations_json) v
    WHERE json_array_length(v.value, '$.items')
        != json_array_length(workouts.variations_json, '$[0].items')
      OR EXISTS (
        SELECT 1 FROM json_each(v.value, '$.items') i
        WHERE lower(trim(json_extract(i.value, '$.exercise'))) != lower(trim(json_extract(
          workouts.variations_json, '$[0].items[' || i.key || '].exercise'
        )))
      )
  ) THEN (
    SELECT json_group_array(json_object(
      'exercise', json_extract(i.value, '$.exercise'),
      'doses', json(CASE
        WHEN (
          SELECT count(DISTINCT json_extract(v.value, '$.items[' || i.key || '].dose'))
          FROM json_each(workouts.variations_json) v
        ) = 1 THEN json_array(json(json_extract(i.value, '$.dose')))
        ELSE (
          SELECT json_group_array(json(json_extract(v.value, '$.items[' || i.key || '].dose')))
          FROM json_each(workouts.variations_json) v
        )
      END)
    ))
    FROM json_each(workouts.variations_json, '$[0].items') i
  )
  ELSE (
    SELECT json_group_array(json_object(
      'exercise', json_extract(i.value, '$.exercise'),
      'doses', json_array(json(json_extract(i.value, '$.dose')))
    ))
    FROM json_each(workouts.variations_json, '$[0].items') i
  )
END;
--> statement-breakpoint

-- Only hangboard rested between exercises; every kind does now, so the rest it never
-- showed comes off the others.
UPDATE workouts SET exercise_rest_s = 0 WHERE kind != 'hangboard';
--> statement-breakpoint

-- A week change to a dose its item no longer has would never apply.
DELETE FROM week_changes
WHERE variation > 0 AND EXISTS (
  SELECT 1 FROM memberships m
  JOIN workouts w ON w.user_id = m.user_id AND w.id = m.workout_id
  WHERE m.user_id = week_changes.user_id AND m.id = week_changes.membership_id
    AND coalesce(json_array_length(w.items_json, '$[' || week_changes.item || '].doses'), 0)
      <= week_changes.variation
);
