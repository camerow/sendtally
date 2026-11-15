# Training descriptions and media

Status: approved by Will on 2026-11-14; being built in slice order.
Brief: Will, 2026-11-14, with his decisions of the same day (custom workout descriptions first, the built-in library moves to D1, thumbnails in lists, English only for new text, a hero image on workout detail, media in the info sheet).
Designs: a new page "Training descriptions and media" (page id `training-media`) on the canvas https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto.
The v3 page is untouched; it was read for reference only.

| Board             | Title                                             | Position on `training-media` |
| ----------------- | ------------------------------------------------- | ---------------------------- |
| `TdmDescriptions` | Descriptions on detail screens                    | x 0, y 0                     |
| `TdmWriting`      | Writing a description, and reading it mid-workout | x 0, y 1680                  |
| `TdmThumbs`       | Thumbnails in lists and pickers                   | x 0, y 3320                  |
| `TdmHero`         | A picture as the hero of a detail screen          | x 0, y 5060                  |
| `TdmSheet`        | The info sheet holds the picture or video         | x 0, y 7120                  |
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
- Mobile native modules: `expo-image`, `expo-video`, `react-native-webview` and any image picker are **not** in the build.
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

1. Exercises, grips and workouts can have zero or more pictures and YouTube videos; none renders nothing.
2. Version one is curator media on built-ins only.
   The table carries an owner column so user media on custom items is a later addition, not a rewrite.
3. **Changed (decision 7):** a video is a YouTube video, attached by pasting its link in the moderation Library and played inside the app; we host no video at all.
   See "YouTube videos" below.
4. Storage: pictures on R2 alone (below), one bucket created in Terraform, served from `media.sendtally.com`.
5. Upload: pictures through the Worker, which validates and writes to R2 (below).
6. Every picture is resized in the browser before upload to two files: 1600 px on the long side for detail and a 144 px square crop for thumbnails (44 pt at 3x).
7. Each item has alt text (English only), an order and an optional credit line.
   Media saves as it uploads; an item without alt text stays hidden in the apps until it has some, so alt is required to publish rather than to upload.
8. Delivery: immutable keys (`library/<itemType>/<itemId>/<uuid>-<size>.jpg`), `Cache-Control: public, max-age=31536000, immutable`, cached by Cloudflare on the media host.
9. Where it shows (`TdmHero`): on workout, exercise and grip detail screens, media is a full-bleed 4:3 hero behind the top of the screen, and the content scrolls up and over it.
   Several items swipe sideways inside that one frame with page dots, and the credit sits in small muted mono under the title area; there is no second media frame, so everything below the hero stays exactly today's anatomy.
   Blocks keep their header until ready-made blocks have media.
   An item without media keeps today's screen exactly (decision 5, extended to exercises and grips on the board).
   A workout without a picture keeps today's screen exactly.
   **Changed (decision 6):** the info sheet (`WorkoutInfo`, and the exercise info button in R1.9) holds the item's media at the top with the same hero treatment and the description below; media only, description only, or both; neither means no info button.
   **Changed (decision 3, then Will's canvas comment):** every list row and picker row gets one 44 px tile column: an item with a picture shows it inside a 2 px `KIND_LOOK` ink border, and every other item, including one with only a video, shows its kind's tint with its mark scaled up (a square `CategoryMark`).
   The 36 px round mark leaves `CategoryRow` everywhere, and exercise and picker rows gain the tile, so mixed lists keep one column.
10. Videos never autoplay: a poster and a play button; a tap plays.
    This one rule removes the reduced-motion and metered-connection branches, and it is also what YouTube's policies ask, since a loaded player shares data with YouTube.
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
- `library_media`: id, `item_type`, `item_id`, `owner_id` (null for the library; a user id later), `kind` (`picture | youtube`), `key` and `thumb_key` (pictures), `video_id` (YouTube), width, height, bytes, alt (a picture's alt text or a video's title), credit, position, `created_by`, `created_at`.
- Account deletion: no change in version one, since media has no user owner.
  When user media arrives, `repo.deleteUserData` deletes rows and objects.

## API and connector changes

- `exerciseBody` and the block body gain `description` (`z.string().trim().max(2000)`), with the response types following.
- `get_training_library` returns descriptions for user exercises and every built-in (from D1); `save_exercise` and `save_block` accept one; `get_plan` returns block descriptions.
- Media comes back on library items as `{kind: "picture", url, thumbUrl, width, height, alt, credit}` or `{kind: "youtube", videoId, title}`; the apps never build picture URLs, and build the YouTube embed from the id in one shared helper.

## Storage recommendation and cost

Recommendation: **pictures on R2 alone**, with sizes made in the browser at upload; **videos on YouTube**, which costs us nothing and hosts nothing of ours.
Pictures cost $0 a month at 100 and at 1,000 items (about 0.3 GB at 1,000, against a 10 GB free allowance).

Prices fetched 2026-11-14:

- R2: 10 GB-month, 1 million Class A and 10 million Class B operations free; then $0.015 per GB-month, $4.50 and $0.36 per million; egress free.
  A custom domain on a zone in the same account enables caching. https://developers.cloudflare.com/r2/pricing/ , https://developers.cloudflare.com/r2/buckets/public-buckets/
- Images transformations: 5,000 unique transformations a month free, then $0.50 per 1,000. https://developers.cloudflare.com/images/pricing/
- Worker request bodies: 100 MB on Free and Pro zones. https://developers.cloudflare.com/workers/platform/limits/

Dropped with self-hosted clips: Cloudflare Stream (about $6.67 a month at 100 clips and $21.67 at 1,000), Media Transformations for posters, MP4 caching rules, and the clip cost rows.
Images transformations stay unused, because a canvas makes the two picture sizes once at upload.

## Upload path

- The moderation page sends the file straight to the Worker (`POST /v1/moderation/library/:type/:id/media`), which streams it into R2 through a bucket binding.
- 5 MB fits well inside the 100 MB body limit, and it needs no S3 credentials, presigned URLs or bucket CORS; the role check is the existing gate.
- The Worker checks the declared type against the allowlist (JPEG, PNG, WebP), the size, and the magic bytes, and rejects with a clear message.
- Errors shown, one line per file: "Too large", "Use JPEG, PNG or WebP"; a row without alt text says "Alt text is required" and stays hidden in the apps.
- A video is attached with `POST /v1/moderation/library/:type/:id/videos` and a pasted link; the Worker reduces it to an 11-character video id (watch, `youtu.be`, shorts, embed and `youtube-nocookie.com` forms) or rejects it with "Not a YouTube video link".
  Nothing is fetched from YouTube on attach.
  Deleting a video removes only the row, so Restore works for videos.
- The upload row shows the browser resize to 1600 px, then a progress bar with Cancel.

## Native cost

| Need                               | Module                 | In the build | Ships        |
| ---------------------------------- | ---------------------- | ------------ | ------------ |
| Descriptions, links                | `Text`, `Linking`      | yes          | over the air |
| Pictures and thumbnails            | React Native `Image`   | yes          | over the air |
| Video playing inline               | `react-native-webview` | no           | store build  |
| Disk-cached images, list recycling | `expo-image`           | no           | store build  |

One store build carries every native addition in the plan: `react-native-webview` and `expo-image`.
`expo-video` drops out.
Nothing else needs native code: moderation is web only, so no image picker.

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
- Videos are never saved for offline use (Will: "no need to cache videos offline"); with no connection, YouTube's player shows its own message.
  The play button's label is `workouts.playVideo`, in all four catalogs.
- Content shorter than the screen does not scroll; the screen reads as picture then content, which is the same design.
- Web: the same layering in CSS alone.
  The picture is `position: sticky; top: 0` inside `DetailFrame`, capped at `max-height: 420px` with `object-fit: cover`, and the content follows with `position: relative`, a higher `z-index` and the page background.
  No script, so nothing to respect for reduced motion.

## Media in the info sheet (decision 6)

- `Sheet` (`@gorhom/bottom-sheet`, installed) gains an optional `hero`, rendered behind its `BottomSheetScrollView` the same way: absolute at the top, a transparent spacer, the description on white scrolling over it, clipped to the sheet's top radius.
- A picture works over the air with React Native `Image`.
- A video shows as its poster with a play button; how it plays is in "YouTube videos" below, the same in the sheet as in the hero.

## YouTube videos (decisions 7 and 8)

Will: "Maybe we can use youtube and in app-player instead of uploading our own videos?", then "store build is worth it", then "ship inline player right away ... we can use the items picture, and Ill be sure to make images for everything we support".
Videos ship only as the inline player, in the store build; there is no in-app browser stopgap.

### The player

- Tap swaps the poster for YouTube's player in a `react-native-webview` inside the same frame: a `youtube-nocookie.com/embed/<id>?playsinline=1&rel=0` iframe in an HTML page loaded with `baseUrl: "https://com.sendtally.app"`, which is the Referer YouTube asks WebViews to send (without it the player shows error 153).
- 16:9 at full width (390x219 pt on a 390 pt phone) meets the 200x200 minimum; it sits centred on black in the 4:3 frame.
- `react-native-webview` is not in the build, so videos arrive with the store build (slice 4).
  Older binaries keep running slice 3's JavaScript, which renders only `kind === "picture"`, so a video attached in moderation is simply absent there; the fingerprint keeps slice 4's JavaScript off them.
- Web: the same `youtube-nocookie.com` iframe in the frame, shipping with slice 4 so both platforms get videos together.
- Considered and dropped (Will, "ship inline player right away"): opening the `youtube.com` watch page in the in-app browser over the air as a stopgap.

### What YouTube's policies require

From https://developers.google.com/youtube/terms/developer-policies and https://developers.google.com/youtube/terms/required-minimum-functionality, fetched 2026-11-14:

- The embedded player is a YouTube API Service; a plain embed needs no API key or project (III.D.1, III.D.2).
- Nothing may overlay any part of a playing player (Required Minimum Functionality).
  So the covered-hero behaviour applies to the poster only: once a video plays, its frame scrolls up with the content instead of being covered, and it pauses when it leaves the screen, since background play is not allowed (III.I.9).
- No storing or caching YouTube content, thumbnails included (III.E.1), and no offline playback.
- No hiding or replacing YouTube's ads, links or branding (III.I.4 to III.I.6).
  End-of-video suggestions cannot be switched off: `rel=0` only limits them to the same channel (https://developers.google.com/youtube/player_parameters).
- Any screen showing YouTube content, a thumbnail included, must make clear that YouTube is the source (III.F.2.a); the poster carries a small "YouTube" label.
- The privacy policy must link to Google's privacy policy, and the terms must say users agree to YouTube's Terms of Service (III.A.1, III.A.2).
- Selling ads on a screen that shows YouTube content needs enough independent content around it (III.G.1.d); detail screens have it, and the mobile ads plan should keep video screens in mind.

### Poster

- The poster is always the item's own first picture, so the app makes no request to Google until a tap; YouTube's thumbnails are never used, stored or loaded.
- A video shows in the apps only once its item has a picture, the same rule as alt text; the moderation video row says "Hidden until this has a picture" until then.
  Will makes a picture for every item that gets a video.

### Links in descriptions

A YouTube link typed in any description, including a user's own custom workout, stays a plain link opened with the system (R1.6).
Only videos attached in moderation get the poster and the player.

### Offline

The poster is our picture, so it shows from the image cache.
Videos are never saved for offline use, and a tap with no connection leaves YouTube's player to show its own message.

## Thumbnails, caching and list performance

- Every row has the 44 pt tile (`TdmThumbs`): the picture's 144 px square JPEG (around 10 KB, made in the browser) inside the kind's border, or the kind's tint with a square `CategoryMark` when there is no picture.
  No server-side resizing.
- The round 36 px mark in `CategoryRow` is removed, and exercise rows and `PickerRow` gain the tile column, so this slice touches every library list, not only items with pictures.
- Lists are short (at most about 80 rows per category) and rows are fixed-size, so `Image` with fixed dimensions is enough; `expo-image` replaces it in the store build.
- A video never gives a list thumbnail: a thumbnail of YouTube content needs YouTube attribution in the row, and a stored copy is not allowed.
- Immutable keys mean a replaced picture is a new URL, so no cache ever serves a stale image.

## Moderation Library tab (`TdmModLibrary`)

- A fifth tab, Library, in `MODERATION_TABS`, built from the existing `mod-card` and tab styles, with plain English strings (moderation is never localised).
- The tab's count is the number of built-ins missing a description or a picture.
- The list: filter pills All / No description / No picture / Retired, rows grouped workouts first, then exercises by category.
  Columns: thumbnail, name, category, description (its start, or a gold "No description" label), media count or a gold "No picture", and the changed date or "Seeded".
- The item: a back link, kicker and English name, and header buttons Retire (plain outline, not red, because retiring is reversible) and Save (azure) for name and description.
- A folded "Other languages · 3 names" group for the de/fr/es names.
- The description textarea with "n of 2,000" beside a phone preview rendered by the apps' parser.
- A Media card with "Add picture" and "Add YouTube video" (azure).
  A picture row has thumbnail, alt text, optional credit, "Picture · added <date> by <name>", up and down, and Delete (red outline, confirm says it is permanent).
  A video row has a required title, optional credit, "Video · youtu.be/<id> · added <date> by <name>", up and down, and Delete with no confirm; the Changes list shows "Video removed" with Restore.
  Media saves as it is added, not with Save.
- The Changes list with Restore; rows for deleted picture files say "Permanent" instead, while a deleted video restores.
- The Retire confirm says logs, plans and workouts keep it by name; Unretire lives under the Retired filter.

## New interface strings

`common.more`, `common.less`, `workouts.playVideo`, plus the exercise and block Description field labels (the workout ones, `workouts.description` and `workouts.descriptionPlaceholder`, are reused), in all four catalogs.
Moderation strings are plain English literals.

## Privacy and analytics

- Pictures come from our own domain on Cloudflare, already listed in `apps/web/app/routes/privacy.tsx`.
- **New third party: Google (YouTube).** `privacy.tsx` names it: when you play a video, YouTube receives your device's IP address and the usual browser data, and privacy-enhanced mode keeps the view from personalising YouTube or its ads; it links to https://www.google.com/policies/privacy as YouTube requires.
- `apps/web/app/routes/terms.tsx` gains a line that videos are YouTube's, under YouTube's Terms of Service, with the link.
- Add one line that links in descriptions lead to other sites, which have their own privacy terms.
- Events, counts and enum strings only: `description_link_opened` {`item_type`: exercise | workout | block, `source`: library | mine} and `video_played` {`item_type`}.
  Moderation writes are logged in `library_changes`, not PostHog.

## Delivery slices

1. **Custom descriptions (smallest useful first slice, over the air).** Parser, formatted rendering with More / Less for the workout descriptions that already exist, `description` on custom exercises and blocks with their editor fields, the live info button for the current exercise, connector fields.
   Removes nothing; `LibraryIntro`'s plain text becomes the shared renderer.
2. **Built-in library in D1 (over the air, largest).** Table, seed migration, `GET /v1/library`, the apps and Worker reading it, built-in exercises opening `ExerciseScreen`, moderation Library tab with text editing and Changes.
   Removes the built-in content constants, about 130 catalog keys in each of the four locales and the editor artifact; repoints `library-add`.
3. **Pictures (over the air, plus Terraform).** Bucket, media host, Worker binding, picture upload, the hero on detail screens, pictures in the info sheet, the tile column on every list and picker row, alt and credit.
   Adds the R2 bucket; removes nothing.
4. **YouTube videos, inline (one store build).** Attaching links in moderation, `react-native-webview` for the inline player in the hero and the info sheet, including the live sheet for the current exercise, the `youtube-nocookie.com` iframe on web, and the privacy and terms lines; `expo-image` swapped in for `Image` in the same build.
   Removes nothing in code; drops `expo-video` and the in-app browser stopgap from the plan.
5. **Ready-made blocks.** `library_items` type `block` once the Starter block lands; block media then comes for free.

## Deliberately left out

- User uploads on custom items (the model allows them later).
- Autoplay, players for YouTube links typed in descriptions, a rich text toolbar, images inside text.
- Dropped with decision 7: self-hosted clips, their 20 second / 1080 px / 8 MB limits and errors, first-frame posters made in the browser, video in R2, MP4 caching rules, Cloudflare Stream and Media Transformations, and `expo-video`.
- Per-locale descriptions, alt text and credit.
- Restoring deleted picture files, server-side resizing.
- Moderator tools on the connector (`save_library_item`) for editing built-ins (Will: "yeah we can skip that").
- Creating new built-ins in moderation (slice 2 follow-up; `library-add` covers it until then).

## Decided

Will answered the last four open decisions on 2026-11-14, all yes.

1. Every library and picker row gets the 44 px tile as drawn on `TdmThumbs`, a picture or the kind's tinted square mark, replacing the round mark; it ships with pictures in slice 3.
2. The library editor artifact is retired when slice 2 ships (Will: "it's not that useful").
3. Editing an English field in moderation clears that field's translations.
4. Exercise and grip detail screens get the hero too, the same `ScreenFrame` prop and anatomy as workouts.
