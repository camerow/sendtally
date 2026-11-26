---
name: library-add
description: Add built-in exercises and workouts to the standard training library every user gets, as a D1 data migration. Use when Will says "add an exercise", "add a workout", "/library-add", or describes exercises or workouts every user should get out of the box. Moderators can also create one built-in at a time, and edit existing ones, on the web admin Library page (/app/admin/library).
argument-hint: "<what to add, e.g. pull-ups and a pyramid workout>"
---

# Add to the built-in library

The library lives in D1, in `library_items` (`packages/api/src/db/schema.ts`), served to the apps by `GET /v1/library`.
A user's own exercise links to a built-in by id, and sessions and plans reference a built-in workout by id, so an id is frozen once it ships and never reused, retired ones included.
Moderators create single built-ins, and edit names, descriptions and other-language names, add pictures and retire built-ins, on the web admin Library page (`/app/admin/library`, New exercise and New workout).
That form derives the id from the name the same way (`libraryIdOf` in `packages/core/src/hang/builtIns.ts`) and the Worker refuses an id any built-in ever had.
Use this skill when Will asks you to add built-ins, several at once, or with translated descriptions, which the form does not take.
Do not ask Will for anything you can default; make the call, then list what you chose at the end.

## Where things are

| What                          | File                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| The seeded library            | `packages/api/migrations/0039_seed_library.sql`, and any later `*_library_*.sql` data migrations            |
| Row and spec shapes           | `packages/api/src/lib/library.ts` (Zod), `packages/core/src/hang/builtIns.ts` (types)                       |
| Allowed values                | `packages/core/src/hang/exercise.ts`, `packages/core/src/hang/plan.ts`, `packages/core/src/hang/library.ts` |

Read the seed and any later library migrations before writing, so a new id is unique and the style matches.

## Steps

1. Generate an empty data migration: `pnpm --filter @sendtally/api exec drizzle-kit generate --custom --name library_<what>`.
   Never hand-write the file name or touch `migrations/meta/`.
2. Write one `INSERT INTO library_items (type, id, position, name, description, translations, spec) VALUES ... ON CONFLICT (type, id) DO NOTHING;`, with a comment line saying what it adds.
   `position` puts it last in its type: `(SELECT coalesce(max(position), -1) + 1 FROM library_items WHERE type = '<type>')`, one statement per row when adding several.
3. Apply it locally (`pnpm --filter @sendtally/api exec wrangler d1 migrations apply DB --local`) and run the checks.

## Exercise

- `id`: `libraryIdOf("exercise", name, kind)`, camelCase from the English name, never one any exercise ever had.
- `spec`: `{"kind", "measure"[, "dose"]}`.
  `kind` is one of `EXERCISE_KINDS` (`climbing`, `strength`, `mobility`, `other`); `measure` one of `EXERCISE_MEASURES` (`reps`, `repsWeight`, `seconds`, `secondsWeight`, `rounds`, `laps`; climbing only takes `reps`, `seconds` or `laps`).
  `dose` only when the measure's default start is wrong for it, e.g. `{"sets": 1}`.

## Workout

- `id`: `libraryIdOf("workout", name, kind)`, kebab-case prefixed by kind (`climb-…`, `fingers-…`, `strength-…`, `mobility-…`, `other-…`), never one any workout ever had.
- `spec`: `{"kind", "focus", "minutes", "targetRpe", "items"}`.
  `kind` is one of `WORKOUT_KINDS`; `focus` one of `FOCI` or `null`; `minutes` and `targetRpe` (1-10) set, except hangboard workouts, which leave both `null` like their siblings.
- `items`: hangboard uses `{"grip", "doses"}` with a grip from `BUILT_IN_GRIPS`; every other kind uses `{"exercise": "<built-in exercise id>", "doses"}`, adding the exercise first when it is new.
  Plain interval steps (`{"step": "hard"}` / `"easy"`) are the only exception.
- A dose: `sets` always; `reps`, `onS`, `offS`, `setRestS` (seconds) as the prescription needs.
  Hangboard built-ins never carry `edgeMm` or `weightKg`; two doses on one item make it alternate (A/B weeks).
- `description`: the English blurb, one sentence in the existing voice: what it trains and why a climber does it.

## Copy

- `name` and `description` are American English; `translations` is `{"de": {"name", "description"}, "fr": {...}, "es": {...}}` in natural, idiomatic German, French and Spanish matching the neighbouring rows' register.
- Names are short and in natural case; the UI uppercases where it wants to.
- No board brand names.

## Check

```sh
rtk err pnpm check-types
rtk test pnpm --filter @sendtally/api test
pnpm format
```

Then report a short table of what was added (id, kind, measure or focus, doses) and any value you defaulted.
