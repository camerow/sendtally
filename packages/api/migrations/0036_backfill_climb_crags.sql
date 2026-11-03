-- Data-only, one time: every climb record without a crag takes the crag of the newest session
-- it was logged at one in, else the crag of the Areas climb it is linked to. A stamped
-- userClimbId decides which record a logged climb is, otherwise its name does. From here on
-- a record's crag is set when it is recorded or edited, so an emptied crag stays empty.
UPDATE user_climbs SET area_id = coalesce(
  (
    SELECT s.area_id FROM sessions s, json_each(s.climbs_json) c
    WHERE s.user_id = user_climbs.user_id
      AND s.area_id IS NOT NULL
      AND coalesce(
        json_extract(c.value, '$.userClimbId') = user_climbs.id,
        lower(trim(json_extract(c.value, '$.name'))) = lower(user_climbs.name)
      )
    ORDER BY s.start_at DESC
    LIMIT 1
  ),
  (SELECT a.area_id FROM area_climbs a WHERE a.id = user_climbs.area_climb_id)
)
WHERE area_id IS NULL;
