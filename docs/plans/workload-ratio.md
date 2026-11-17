# Workload ratio

How this week's training load compares with the person's own last four weeks, plotted over time on the training statistics page.
Will asked for it on 2026-11-16 as the acute to chronic workload ratio.

## Formula

Load of one logged thing is its RPE (rate of perceived exertion, 1 to 10) times its minutes.
Days are the climber's wall-clock days, read the way the statistics page already reads them (`dayStart(wallClock(now))` in `trends/buckets.ts`).
Acute load is the summed load of the 7 days ending today, today included.
Chronic load is the summed load of the 28 days ending today, divided by 4.
Ratio is acute divided by chronic.

Worked example: three 60 minute sessions a week at RPE 6 is 1080 a week.
A steady month gives acute 1080, chronic 4 x 1080 / 4 = 1080, ratio 1.0.
Double this week to 2160 and chronic becomes (3 x 1080 + 2160) / 4 = 1350, so the ratio is 2160 / 1350 = 1.6.
Because the acute week sits inside the chronic window, the ratio can never pass 4.0, and a doubled week reads 1.6, not 2.0.

## Zones

Under 0.8: lighter than usual or resting.
0.8 to 1.3 inclusive: the sweet spot.
Above 1.3 up to 1.5 inclusive: caution.
Above 1.5: a much bigger week than your last four, consider more rest.

## 1. What counts

Every record comes from the one list the statistics page already builds, `doneOf` in `packages/features/src/statistics/insights.ts`, which gets exported for this.
That keeps a single minutes rule: when `bug/multi-grip-hang-sessions` lands, `doneOf` reads `hangSessionSeconds` and the ratio counts every grip with no change here; when the fingers-in-workouts `runMinutes` lands, it replaces the readers inside `doneOf` and again the ratio follows.

- Climbing session: RPE is stored on every row, but an unscored session (`rpe_source = "none"`) has no RPE. Minutes are end minus start only when both times were logged (`times = "both"`), otherwise none.
- Activity (strength, mobility, other): minutes are required, RPE is optional.
- Hang session: minutes from the protocol, always present; RPE is optional.

A record with no RPE or no minutes is left out of the load, never counted as zero and never given a default RPE.
A silent zero would understate the week and make the following weeks look bigger than they were; a default RPE would invent effort the person did not report.
The card says how many records in the last 7 days were left out ("2 sessions not counted: no RPE or no time"), so the person can fix them from the session.
Each left-out row opens its record, so the person can fix it there.

### A partly counted week

The zone is withheld when more than a quarter of the records in the last 7 days, or in the last 28 days, were left out; the card then says how many of them were counted instead of naming a zone.
One session in four missing moves acute or chronic by about 25%, about the width of the sweet spot (0.8 to 1.3), so past that the zone can be wrong.
Both windows count because records missing in earlier weeks shrink chronic and inflate the ratio, just as records missing this week deflate it.
This check comes before the start and break rules: a week that is mostly left out says so first.

### Climbing sessions without times

Since 7784726f (2026-11-03) neither log-session form, mobile or web, has start or end time fields, so a climbing session logged through the form is saved with `times = "none"` and has no duration.
Climbing gets a duration from the live session tally (mobile and web), from sessions logged before that change, from legacy board rows, and when a CSV import or the assistant connector supplies both times.
`DEFAULT_DURATION_MINUTES` (90) in `core/manual.ts` builds a placeholder `start_at` and `end_at` for scoring; it never feeds load.
Since #443 both forms have an optional "How long" field that saves `times = "duration"`, and `sessionMinutes` counts it, so a session logged with a length counts in the load.
A not-counted row missing its time opens Edit session on the Duration field (`?field=duration`); one missing only its effort opens the session.

## 2. The start and a return

No ratio until the first counted record is at least 28 days old; before then the card shows this week's load and how many days are left until the first ratio.
No ratio when the three weeks before this one hold no counted load (back after a break); the card says so and shows this week's load.
Without that rule a first week back reads 4.0, which only says the person was away.
After one week back the ratio returns, and a high value then is accurate: this week is much bigger than the last four.
No ratio when the 28 days hold fewer than four counted records, about one a week; the card says too few sessions to compare.
Below that the ratio only takes a few fixed values (one or two sessions in the window give 0, 2.0 or 4.0) and swings between the floor and the top.

## 3. The window

Built as Will gave it: chronic is the plain average of the last four weeks, acute week included.
Variant one, chronic from the three weeks before the acute week ("uncoupled"), lets a doubled week read 2.0 and has no 4.0 ceiling; not built because Will defined the coupled one and the zone numbers he gave come from it.
Variant two, exponentially weighted moving averages for both loads, weights recent days more and smooths week edges; not built because it is harder to explain on a card and needs a decay constant Will has not chosen.

## 4. Where it is computed

One pure function, `workloadRatio(done, today)`, in `packages/features/src/statistics/workload.ts`, taking the `doneOf` records so it needs no new minutes code, plus `workloadVM(log, range, now)` that builds the card's points and words.
It lives in `features`, not `core`, because its input is the API log type.
Both apps call it through `useTrainingInsights`, which already loads the whole log (`GET /v1/sessions?include=climbs`, no cap), so there is no new request, no new table and no new endpoint.
The work is a filter and sum over the log per plotted point; at a few thousand records and at most ~60 points it stays well under a frame.

## 5. The plot

The range comes from the page's existing range control; each point is the ratio as of that day: one a day on 7D and 1M, one a week (the ratio on each week's last day) on longer ranges.
The axis is logarithmic from 0.25 to 4.0, centred on 1.0, so half and double sit the same distance from it and no ratio is clipped (4.0 is the ceiling); a ratio under 0.25 sits on the floor.
A week with nothing logged is a hollow dot in a Rest lane under the axis, not a drop of the line.
Each point is a dot, joined to its neighbours by a thin line, so a lone point between two gaps still shows.
Points with no ratio (too early, too much left out, after a break, or too few counted) are gaps; under four points the chart is left out and the card says it in words.
The first axis label carries the year when the range crosses into another year.
The four zones are horizontal bands behind the line, drawn with the page's chart geometry (`plot`, `polyline` in `chartGeometry.ts`); no new chart primitive unless the designer's board needs one.
Today's ratio and zone are stated in words above the chart, and tapping the card opens the acute and chronic loads behind it and the records left out.

## 6. Colour

Chosen on the board from the design tokens; red (watermelon) is not used, since it is reserved for destructive actions.
Each zone is also named in words and on the band, so colour never carries the meaning alone.

## 7. Words

The card describes how this week compares with the person's own recent weeks.
It never mentions injury or risk and never predicts anything; the top zone reads "A much bigger week than your last four. Consider more rest."
All strings in `en`, `de`, `fr`, `es` under the `statistics` namespace.

## 8. Who sees it

The statistics page has no per-card gate: every insight shows for everyone, and membership gates the range control (`shownRange` / `isLockedRange` in `trends/types.ts`; non-members get 7D only, the rest locked behind the existing upsell).
The card follows that: everyone sees today's ratio and its 7D line; members can widen the range.
The ratio itself always reads the whole history, so a non-member's number is the same as a member's.
No new gate and no membership wording on the card.

## 9. Analytics

No event.
The statistics page sends none today and nothing here needs a question answered; add one with counts and the zone name only, if Will asks.

## Slices

1. `workload.ts` with tests: steady month gives 1.0, a doubled week, a first month, a gap, records without RPE or minutes, and day boundaries at both window edges.
2. Strings in four locales.
3. Mobile card and detail on the training statistics page.
4. Web card and detail, same behaviour.
5. Seeded local data for every zone and the too-little-history state; iOS simulator and web at 375 and desktop.

## Over the air

JavaScript and strings only, no native module and no new dependency, so it ships as an EAS Update; the fingerprint is checked before the report.

## Open questions for Will

- Coupled window as asked, or the uncoupled variant where a doubled week reads 2.0?
- Should a record missing RPE be counted at a stated default instead of left out?
