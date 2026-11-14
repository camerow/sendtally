# Training descriptions and media

Status: proposal, waiting on Will's approval of the designs.
Brief: Will, 2026-11-14, with his decisions of the same day (custom workout descriptions first, the built-in library moves to D1, thumbnails in lists, English only for new text, a hero image on workout detail, media in the info sheet).
Designs: a new page "Training descriptions and media" (page id `training-media`) on the canvas https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto.
The v3 page is untouched; it was read for reference only.

| Board             | Title                                             | Position on `training-media` |
| ----------------- | ------------------------------------------------- | ---------------------------- |
| `TdmDescriptions` | Descriptions on detail screens                    | x 0, y 0                     |
| `TdmWriting`      | Writing a description, and reading it mid-workout | x 0, y 1680                  |
| `TdmThumbs`       | Thumbnails in lists and pickers                   | x 0, y 3320                  |
| `TdmHero`         | A picture as the hero of a detail screen          | x 0, y 5060                  |
| `TdmSheet`        | The info sheet holds the picture or clip          | x 0, y 7120                  |
| `TdmModLibrary`   | Moderation: a Library tab for the built-ins       | x 0, y 8960                  |

## What the code says today

The brief's facts, checked against `main` at `fdae200c`.

- Built-in exercises (77) and workouts (20) are constants in `packages/core/src/hang/builtIns.ts`; the 12 hangboard grips are `BUILT_IN_GRIPS` in `packages/core/src/hang/library.ts`.
  None touch D1.
- Their translated names and blurbs are catalog keys (`workouts.exercise.<id>`, `workouts.builtIn.<id>.name` / `.blurb`, `hang.grip.*`) in all four locales.
- **Correction:** the blurb is already the built-in workout's description.
  `builtInWorkouts()` in `packages/features/src/workouts/builtIns.ts` sets `description: t("workouts.builtIn.<id>.blurb")`.
- **Correction:** custom workout descriptions already exist end to end.
  `workouts.description` in D1, `z.string().trim().max(2000)` in `packages/api/src/lib/plan.ts`, an `EditorTextField` in the mobile and web workout editors, plain text in `LibraryIntro` (between title and mono meta), and the live screens' `WorkoutInfo` button, which opens it in a sheet.
  The connector's `get_training_library` and `save_workout` already read and write it.
- So for workouts, R1.2, R1.6 (live access) and R1.7 are done; what is missing is formatting, collapsing long text, and the same for exercises and blocks.
- Exercises: `exercises` rows have no description.
  A built-in exercise only gets a row (with `built_in` set and its name locked, `workouts.builtInNameLocked`) once the user first picks it.
  Until then it has no detail screen: `ExerciseCategoryScreen` gives its row no `onPress`.
- Hangboard exercises are grips, with their own `GripScreen` at `/grip/[id]`.
- Blocks (`training_blocks`) have no description.
  Blocks are edited inline in `BlockHeader`'s editing mode, not in a separate editor.
- Ready-made library blocks do not exist; `docs/plans/first-run-onboarding.md` on `feat/first-run-onboarding` proposes one Starter block.
- Moderators: `users.role` is `user | moderator | admin`; one `requireRole("moderator")` middleware is mounted on `/v1/moderation/*` in `packages/api/src/app.ts`.
  The web page is `apps/web/app/moderation/components/ModerationPage.tsx`, with four tabs from `MODERATION_TABS`.
- No R2, Images or Stream binding exists in either `wrangler.jsonc`; `infra/terraform/` holds zone, DNS, D1 and redirects only.
- Mobile native modules: `expo-image`, `expo-video` and any image picker are **not** in the build.
  `expo-network`, `expo-file-system`, `expo-web-browser` and `expo-audio` are.
- Mobile query results are persisted to disk by default (`QueryProvider` with `expo-file-system`), so anything the API serves is available offline after the first fetch.
- The CSV export holds sessions only, so descriptions and media change nothing there.
- Strava activity text names grips through `BUILT_IN_GRIP_NAMES` on the Worker.

## Requirements, as corrected

### R1. Descriptions

1. Exercises (custom and built-in, grips included), workouts and blocks each have an optional description.
   Empty renders nothing: no heading, no placeholder, no gap.
2. Custom items: the owner writes it in the existing editor.
   The exercise editor gains the workout editor's `EditorTextField`; a block gets a Description field in `BlockHeader` editing mode.
   A built-in-linked exercise row shows the library's description and has no field, the same way its name is locked.
3. Built-ins: Will writes it in the moderation Library tab (R3).
4. Format: plain text with a tiny Markdown subset, typed without a toolbar.
   A blank line separates paragraphs, a line starting `- ` is a bullet, a line starting `1.
` is a numbered item, a bare `https://` URL is a link and `[label](https://...)` is a labelled link.
   Nothing else is interpreted; no HTML, no images in text.
5. One pure parser, `packages/core/src/text/description.ts`, returns blocks (`paragraph | bullets | numbered`) of inline runs (`text | link`).
   Mobile renders it with nested `Text`, web with React elements; never a web view, never `innerHTML`.
6. Links are `https` only (anything else stays text) and open with the system (`Linking.openURL` on mobile, a new tab on web), so a video link opens the video app where one is installed.
   No embedded players: that needs a web view and sends viewer data to the host.
7. Limit 2000 characters everywhere, the value `plan.ts` already uses, checked by Zod at the edge and by `maxLength` in the editors.
8. Placement: in the hero, under the title and before the mono meta, the slot `LibraryIntro` uses today, on every detail screen.
   Collapsed past 5 lines with a More / Less text button.
9. Live: the existing `WorkoutInfo` sheet for workouts; for the current exercise an info button after its name in `SetsCard`, and the existing info slot in `TimerHeader` for hangboard.
   The button exists only when there is a description or media.
   Picker rows get the same info `IconButton` at the row end, opening the info sheet, while a tap on the row still ticks it.
10. Built-in exercises open `ExerciseScreen` even before the user has picked one, with the hero, description, media and the existing "nothing logged" `DashedPanel`; no new screen type.
11. The connector reads and writes descriptions on exercises and blocks too (`save_exercise`, `save_block`, `get_training_library`, `get_plan`).
12. English only for new text (Will, decision 4).
    Interface strings stay in all four catalogs as today.

### R2. Media

1. Exercises, grips and workouts can have zero or more pictures and clips; none renders nothing.
2. Version one is curator media on built-ins only.
   The table carries an owner column so user media on custom items is a later addition, not a rewrite.
3. A clip is a short silent loop demonstrating the movement: H.264 MP4, at most 20 seconds, 1080 px on the long side and 8 MB.
   Anything longer is a link in the description.
4. Storage: R2 alone (below), one bucket created in Terraform, served from `media.sendtally.com`.
5. Upload: through the Worker, which validates and writes to R2 (below).
   No transcoding anywhere: the browser checks duration, size and codec before upload and refuses the rest with a clear message.
6. Every picture is resized in the browser before upload to two files: 1600 px on the long side for detail and a 144 px square crop for thumbnails (44 pt at 3x).
   A clip's poster is its first frame, captured in the browser, with the same two sizes.
7. Each item has alt text (English only), an order and an optional credit line.
   Media saves as it uploads; an item without alt text stays hidden in the apps until it has some, so alt is required to publish rather than to upload.
8. Delivery: immutable keys (`library/<itemType>/<itemId>/<uuid>-<size>.jpg|.mp4`), `Cache-Control: public, max-age=31536000, immutable`, a Cache Everything rule on the media host so MP4s cache.
9. Where it shows (`TdmHero`): on workout, exercise and grip detail screens, media is a full-bleed 4:3 hero behind the top of the screen, and the content scrolls up and over it.
   Several items swipe sideways inside that one frame with page dots, and the credit sits in small muted mono under the title area; there is no second media frame, so everything below the hero stays exactly today's anatomy.
   Blocks keep their header until ready-made blocks have media.
   An item without media keeps today's screen exactly (decision 5, extended to exercises and grips on the board).
   A workout without a picture keeps today's screen exactly.
   **Changed (decision 6):** the info sheet (`WorkoutInfo`, and the exercise info button in R1.9) holds the item's media at the top with the same hero treatment and the description below; media only, description only, or both; neither means no info button.
   **Changed (decision 3):** items with a picture also show its thumbnail in list rows and pickers, 44x44 with a 2 px `KIND_LOOK` ink border in place of the category mark; items without keep today's row exactly.
10. Clips never autoplay: poster and a play button; a tap plays muted and loops, another pauses.
    This one rule removes the reduced-motion and metered-connection branches, since nothing downloads before a tap.
11. Offline: a cached picture shows; an uncached one shows the soft surface frame with its alt text.
12. Rights: only media Will owns or has licence for.
    Deleting removes the R2 objects, then the row, and cannot be undone.

### R3. The built-in library in D1 (replaces the lead's content-table recommendation)

Covered in full in "Moving the built-in library to D1" below.

1. A fifth moderation tab, Library, English only and moderator only, lists every built-in with what is missing.
2. Per item: English name, folded de/fr/es names, description with live preview, media upload, reorder, alt, credit, delete, Retire, and a Changes list with Restore.
3. Every write sits behind `/v1/moderation/*`, so the existing server gate covers it.

### R4. Cross-cutting

- Schema through Drizzle, additive only.
  The seed is a data migration, like `0036_backfill_climb_crags.sql`.
- Privacy and analytics as below.
- No board brand names in seeded or sample content.

## Moving the built-in library to D1

This is the largest part of the work and its own slice, ahead of media.

### Table

One table for every built-in kind, so the moderation list, the Changes log and media all key on the same pair.

```
library_items
  type          text  exercise | grip | workout   (block later)
  id            text  the id used today, never changed, never reused
  position      int   order within its kind, as the constants order them today
  status        text  active | retired
  name          text  English
  description   text  English, nullable
  translations  text  JSON {de|fr|es: {name?, description?}}
  spec          text  JSON, Zod-parsed per type: exercise {kind, measure, dose?}; workout {kind, focus, minutes, targetRpe, items}; grip {}
  updated_at, updated_by
  primary key (type, id)
```

Workout items keep naming exercises by built-in id, grip id or step, as `BuiltInItemSpec` does now.
Grip ids stay a typed union in core (`BUILT_IN_GRIPS`), because the hangboard engine and stored hang sessions type-check against them; only their text and media move.

### Stable ids

- The primary key is today's id, so user `exercises.built_in`, hang sessions' `workoutId`, plans and the connector keep resolving.
- Nothing is ever deleted.
  Retired items leave pickers and the library list but still resolve names for history.
- New built-ins get an id from their English name (camelCase for exercises, kind-prefixed kebab-case for workouts, as now), checked unique against retired ids too, and frozen at creation.

### Seed

- A generated script reads `BUILT_IN_EXERCISES`, `BUILT_IN_WORKOUTS`, `BUILT_IN_GRIPS` and the four catalogs and writes one data migration of `INSERT ...
ON CONFLICT (type, id) DO NOTHING`.
- Wrangler applies it once per database; re-running it by hand is safe and never overwrites an edit.
- Fresh local and preview databases get the full library from the migration chain, so tests and PR previews keep working.
- The same PR deletes the constants' content (ids for grips stay), the `workouts.exercise.*`, `workouts.builtIn.*` and `hang.grip.*` catalog keys, and moves the core and features tests that used them onto a small fixture.
  The `i18n.test.ts` parity test keeps passing because the keys go from all four catalogs at once.

### Translations

- The seed copies every catalog name and blurb into `translations`, so nothing regresses for de, fr and es users.
  The blurb seeds the English `description` and the translated `description`.
- The apps show `translations[locale].<field>` when present, else the English field.
- Editing an English field in moderation clears that field's translations, so a rename or a new description reaches everyone in English rather than a stale translation (decision 4 accepts English).
- The folded "Other languages" group lets Will set a translated name by hand; there is none for descriptions.

### Serving, offline and first launch

- `GET /v1/library` returns every active and retired item with all translations and media, about 60 KB, with an `ETag` from the newest `updated_at` and `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.
  It needs no user, so the web Worker and the edge cache serve it for everyone.
- Mobile reads it through a normal query, persisted to disk like every other query, so it works offline after the first fetch.
- First launch needs the network anyway (sign-in), and the library loads alongside the user's own training data, which already does.
  Screens that need it already render `LoadState`.
- Today `builtInWorkouts()` and friends are synchronous; they become selectors over the library query.
  Callers are `features/workouts/library.ts`, `features/sessions/hang.ts`, `features/exercises/picker.ts`, `features/hang/model.ts` and `names.ts`, plus their tests.
- The Worker reads the table through one `repo.library(db)` call.
  Consumers: the connector (`trainingLibrary`, `saveWorkout`, `saveBlock`, `saveExercise`, `deleteWorkout`, `deleteExercise`), `lib/hang.ts`, `hang.ts` and `posting.ts` (grip names in Strava text, which stay English).

### Moderation writes

- `PUT /v1/moderation/library/:type/:id` (name, translations, description, status), `POST .../media`, `PATCH /v1/moderation/library/media/:id` (alt, credit, position), `DELETE /v1/moderation/library/media/:id`.
- Each write appends to `library_changes` (type, id, changed_by, changed_at, before JSON, after JSON).
  Restore writes `before` back as a new change, so history is never rewritten.
- A media delete is logged without a Restore, because the file is gone.

### The `library-add` skill and its editor artifact

- The editor artifact (`XrMUxjdh3vRjEkygfHj7LR`) is retired when this slice ships; editing moves to the moderation tab, and two editors over one library is what Will asked to avoid.
- Until moderation can create items, `library-add` stays for adding new built-ins, repointed to write a new seed data migration instead of editing constants.
- When "New exercise" / "New workout" lands in moderation (reusing the web `WorkoutEditorPage` for items), the skill is deleted.

## Data model for descriptions and media

- `exercises.description` and `training_blocks.description`: nullable text, like `workouts.description`.
- `library_media`: id, `item_type`, `item_id`, `owner_id` (null for the library; a user id later), `kind` (`picture | clip`), `key`, `thumb_key`, `poster_key`, width, height, `duration_ms`, bytes, alt, credit, position, `created_by`, `created_at`.
- Account deletion: no change in version one, since media has no user owner.
  When user media arrives, `repo.deleteUserData` deletes rows and objects.

## API and connector changes

- `exerciseBody` and the block body gain `description` (`z.string().trim().max(2000)`), with the response types following.
- `get_training_library` returns descriptions for user exercises and every built-in (from D1); `save_exercise` and `save_block` accept one; `get_plan` returns block descriptions.
- Media URLs come back on library items as `{kind, url, thumbUrl, posterUrl, width, height, alt, credit}`; the apps never build URLs.

## Storage recommendation and cost

Recommendation: **R2 alone**, with sizes and posters made in the browser at upload.
At both 100 and 1,000 clips (plus as many pictures) it costs $0 a month, and it stays free until roughly 10 GB, about 40,000 clips.

Prices fetched 2026-11-14:

- R2: 10 GB-month, 1 million Class A and 10 million Class B operations free; then $0.015 per GB-month, $4.50 and $0.36 per million; egress free.
  A custom domain on a zone in the same account enables caching; MP4 needs a Cache Everything rule. https://developers.cloudflare.com/r2/pricing/ , https://developers.cloudflare.com/r2/buckets/public-buckets/
- Images transformations: 5,000 unique transformations a month free (past that, error 9422 rather than a bill), then $0.50 per 1,000.
  Media Transformations (video frames and resizing) share that allowance; frame output counts 1, video output 1 per second. https://developers.cloudflare.com/images/pricing/ , https://developers.cloudflare.com/stream/transform-videos/
- Stream: $5 per 1,000 minutes stored (prepaid), $1 per 1,000 minutes delivered, no free tier; HLS and DASH URLs work in native players. https://developers.cloudflare.com/stream/pricing/ , https://developers.cloudflare.com/stream/viewing-videos/using-own-player/
- Worker request bodies: 100 MB on Free and Pro zones. https://developers.cloudflare.com/workers/platform/limits/

Assumptions: 10-second 2 MB clips with a 150 KB poster, as many 300 KB pictures, 10,000 plays a month at 100 clips and 100,000 at 1,000, nothing cached.

| Option                                          | 100 clips   | 1,000 clips  |
| ----------------------------------------------- | ----------- | ------------ |
| R2 alone, sizes and posters made in the browser | $0          | $0           |
| R2 plus Images and Media Transformations        | $0          | $0 to $4.50  |
| Stream for clips, R2 for pictures               | about $6.67 | about $21.67 |

Why not the others: Images adds a zone setting and a monthly cap for something a canvas does once at upload, and Stream bills from the first minute for transcoding we avoid by constraining the format.

## Upload path

- The moderation page sends the file straight to the Worker (`POST /v1/moderation/library/:type/:id/media`), which streams it into R2 through a bucket binding.
- 8 MB fits well inside the 100 MB body limit, and it needs no S3 credentials, presigned URLs or bucket CORS; the role check is the existing gate.
- The Worker checks the declared type against the allowlist (JPEG, PNG, WebP; MP4), the size, and the magic bytes, and rejects with a clear message.
- The browser checks a clip's duration and dimensions from its metadata and its codec from the `avc1` sample entry before sending.
- Errors shown, one line per file: "Too large", "Use an MP4 (H.264)", "Clips are 20 seconds at most"; a row without alt text says "Alt text is required" and stays hidden in the apps.
- The upload row shows the browser resize to 1600 px, then a progress bar with Cancel.

## Native cost

| Need                            | Module               | In the build | Ships            |
| ------------------------------- | -------------------- | ------------ | ---------------- |
| Descriptions, links             | `Text`, `Linking`    | yes          | over the air     |
| Pictures and thumbnails         | React Native `Image` | yes          | over the air     |
| Clips                           | `expo-video`         | no           | store build      |
| Disk-cached images (with clips) | `expo-image`         | no           | same store build |

Pictures ship over the air on `Image`; the clip slice adds `expo-video` and swaps `Image` for `expo-image` in the same store build, for its disk cache and list recycling.

Clips need a store build, so slice 3's code renders only `kind === "picture"` and ignores anything else.
That way clips uploaded later never break a binary without `expo-video`; the fingerprint keeps slice 4's JavaScript off older binaries.

## Hero image on workout detail (decision 5)

Built with what is installed, no new native module, over the air with pictures.

- `ScreenFrame` gains an optional `hero` (a picture).
  Without it, nothing about the frame changes.
- With it, the picture is absolutely positioned at the top of the screen, full width at 4:3, under the status bar (the top safe-area edge moves to the bar), and the `KeypadScrollView` content starts with a transparent spacer of the picture's height.
- The content below the spacer has an opaque white background, so scrolling slides it up and over the still picture.
  The picture never moves, so there is no scroll-driven animation to run or to switch off.
- The bar (Back, Edit, ···) floats over the picture; its buttons sit on white circles, and a top gradient drawn with `react-native-svg` (installed) keeps the status bar legible, with `expo-status-bar` set to light while the picture is under it.
- Several pictures swipe inside the hero with a horizontal paging `ScrollView` and page dots; the vertical scroll still covers the whole frame.
- Pull to stretch is Deferred on the board.
  Without it, iOS overscroll would show white between picture and content, so hero screens set `bounces={false}` on the scroll view; the stretch, when it comes, is a Reanimated scroll handler (Reanimated 4.5 is installed), off under reduced motion (`useReducedMotion`).
- A clip tapped offline shows a Toast, "Can't play this offline" (`workouts.clipOffline`), checked with the installed `expo-network`; the play button's label is `workouts.playClip`.
  Both keys go into all four catalogs.
- Content shorter than the screen does not scroll; the screen reads as picture then content, which is the same design.
- Web: the same layering in CSS alone.
  The picture is `position: sticky; top: 0` inside `DetailFrame`, capped at `max-height: 420px` with `object-fit: cover`, and the content follows with `position: relative`, a higher `z-index` and the page background.
  No script, so nothing to respect for reduced motion.

## Media in the info sheet (decision 6)

- `Sheet` (`@gorhom/bottom-sheet`, installed) gains an optional `hero`, rendered behind its `BottomSheetScrollView` the same way: absolute at the top, a transparent spacer, the description on white scrolling over it, clipped to the sheet's top radius.
- A picture works over the air with React Native `Image`.
- A clip plays inline in the sheet on tap, muted and looping, through `expo-video`'s `VideoView`, which is not in the build: store build, slice 4.
  On Android it uses `surfaceType="textureView"`, because the sheet moves the view and a surface view does not follow transforms.
  The player pauses on dismiss and is released on unmount.
- Until the store build, the sheet shows pictures only (the same `kind` filter).

## Thumbnails, caching and list performance

- One 144 px square JPEG per picture (around 10 KB), drawn at 44 pt; no server-side resizing.
- Lists are short (at most about 80 rows per category) and rows are fixed-size, so `Image` with fixed dimensions is enough; `expo-image` replaces it in the clip slice.
- Immutable keys mean a replaced picture is a new URL, so no cache ever serves a stale image.

## Moderation Library tab (`TdmModLibrary`)

- A fifth tab, Library, in `MODERATION_TABS`, built from the existing `mod-card` and tab styles, with plain English strings (moderation is never localised).
- The tab's count is the number of built-ins missing a description or a picture.
- The list: filter pills All / No description / No picture / Retired, rows grouped workouts first, then exercises by category.
  Columns: thumbnail, name, category, description (its start, or a gold "No description" label), media count or a gold "No picture", and the changed date or "Seeded".
- The item: a back link, kicker and English name, and header buttons Retire (plain outline, not red, because retiring is reversible) and Save (azure) for name and description.
- A folded "Other languages · 3 names" group for the de/fr/es names.
- The description textarea with "n of 2,000" beside a phone preview rendered by the apps' parser.
- A Media card with "Add picture or clip" (azure); each row has thumbnail, alt text, optional credit, "Picture · added <date> by <name>", up and down, and Delete (red outline, confirm says it is permanent).
  Media saves as it uploads, not with Save.
- The Changes list with Restore; rows for deleted files say "Permanent" instead.
- The Retire confirm says logs, plans and workouts keep it by name; Unretire lives under the Retired filter.

## New interface strings

`common.more`, `common.less`, `workouts.playClip`, `workouts.clipOffline`, plus the exercise and block Description field labels (the workout ones, `workouts.description` and `workouts.descriptionPlaceholder`, are reused), in all four catalogs.
Moderation strings are plain English literals.

## Privacy and analytics

- No new third party: media comes from our own domain on Cloudflare, already listed in `apps/web/app/routes/privacy.tsx`.
  Add one line there that links in descriptions lead to other sites, which have their own privacy terms.
- Events, counts and enum strings only: `description_link_opened` {`item_type`: exercise | workout | block, `source`: library | mine} and `clip_played` {`item_type`}.
  Moderation writes are logged in `library_changes`, not PostHog.

## Delivery slices

1. **Custom descriptions (smallest useful first slice, over the air).** Parser, formatted rendering with More / Less for the workout descriptions that already exist, `description` on custom exercises and blocks with their editor fields, the live info button for the current exercise, connector fields.
   Removes nothing; `LibraryIntro`'s plain text becomes the shared renderer.
2. **Built-in library in D1 (over the air, largest).** Table, seed migration, `GET /v1/library`, the apps and Worker reading it, built-in exercises opening `ExerciseScreen`, moderation Library tab with text editing and Changes.
   Removes the built-in content constants, about 130 catalog keys in each of the four locales and the editor artifact; repoints `library-add`.
3. **Pictures (over the air, plus Terraform).** Bucket, media host, cache rule, Worker binding, upload, detail frame, the workout hero image, pictures in the info sheet, list and picker thumbnails, alt and credit.
   Adds the R2 bucket; removes nothing.
4. **Clips (store build).** `expo-video` and `expo-image`, posters, tap to play on detail screens and inline in the info sheet, including the live sheet for the current exercise.
5. **Ready-made blocks.** `library_items` type `block` once the Starter block lands; block media then comes for free.

## Deliberately left out

- User uploads on custom items (the model allows them later).
- Embedded third-party players, autoplay, a rich text toolbar, images inside text.
- Per-locale descriptions, alt text and credit.
- Restoring deleted files, picking a poster frame, server-side resizing or transcoding.
- Creating new built-ins in moderation (slice 2 follow-up; `library-add` covers it until then).

## Open decisions for Will

1. Clip limits of 20 seconds, 1080 px and 8 MB.
   Recommendation: keep them; long demonstrations are links.
2. Thumbnails replace the category mark rather than sitting beside it (`TdmThumbs`).
   Recommendation: replace, so rows keep their height.
3. Retire the library editor artifact when slice 2 ships.
   Recommendation: yes; one editor.
4. Editing an English field clears its translations.
   Recommendation: yes, a stale German name is worse than an English one.
5. Exercise and grip detail screens get the hero too, not only workouts (Will named workouts; `TdmHero` draws all three).
   Recommendation: yes, it is the same `ScreenFrame` prop and the same hero anatomy.
6. Moderator tools on the connector (`save_library_item`) so an assistant can draft built-in descriptions.
   Recommendation: later, after the moderation tab has been used by hand.
