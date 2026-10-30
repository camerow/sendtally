-- Data-only: climbing exercises are measured in climbs (reps) or time on the wall
-- (seconds), both logged on the session tally. One never logged moves onto them:
-- time onto time on the wall, anything else onto climbs. One with logged sets keeps
-- its measure, so its history reads as before.
UPDATE exercises
SET measure = CASE
  WHEN measure = 'secondsWeight' OR built_in = 'arc' THEN 'seconds'
  ELSE 'reps'
END
WHERE kind = 'climbing'
  AND measure NOT IN ('reps', 'seconds')
  AND NOT EXISTS (
    SELECT 1
    FROM activities a, json_each(a.done_json) d
    WHERE a.user_id = exercises.user_id
      AND lower(trim(json_extract(d.value, '$.exercise'))) = exercises.name_key
      AND json_array_length(d.value, '$.sets') > 0
  );
