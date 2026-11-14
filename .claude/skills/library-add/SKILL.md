---
name: library-add
description: Add or edit built-in exercises and workouts in the standard training library that ships with the app, from a description or from the visual editor artifact. Use when Will says "add an exercise", "add a workout", "/library-add", "/library-add apply" or "/library-add sync", or describes exercises or workouts every user should get out of the box.
argument-hint: "apply | sync | <what to add, e.g. pull-ups and a pyramid workout>"
---

# Add to the built-in library

The library is fixed in code.
Built-ins never touch D1: a user's own exercise links to a built-in by id, and sessions and plans reference a built-in workout by id.
Do not ask Will for anything you can default; make the call, then list what you chose at the end.

## Files

| What                     | File                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Exercises and workouts   | `packages/core/src/hang/builtIns.ts` (`BUILT_IN_EXERCISES`, `BUILT_IN_WORKOUTS`), with their English names |
| Names and blurbs         | `packages/features/src/i18n/locales/{en,de,fr,es}/workouts.ts`                                              |
| Allowed values           | `packages/core/src/hang/exercise.ts`, `packages/core/src/hang/plan.ts`, `packages/core/src/hang/library.ts` |

Read the current entries in each file before writing, and follow their order and style.
Core holds each English name for the Worker, and the `en` catalog repeats it; a features test fails when they differ.

## Exercise

1. Add `{ id, name, kind, measure[, dose] }` to `BUILT_IN_EXERCISES`, grouped with its kind.
   - `id`: camelCase, unique among the built-in exercises (the core test checks).
   - `kind`: `EXERCISE_KINDS` (`climbing`, `strength`, `mobility`, `other`).
   - `measure`: `EXERCISE_MEASURES` (`reps`, `repsWeight`, `seconds`, `secondsWeight`, `rounds`); climbing only takes `reps` or `seconds`.
   - `dose`: only when the measure's default start is wrong for it, e.g. `{ sets: 1 }`.
2. Add `"workouts.exercise.<id>"` to all four catalogs, next to the other `workouts.exercise.*` keys; `en` carries the same name as core.

## Workout

1. Add an entry to `BUILT_IN_WORKOUTS`, grouped with its kind:
   - `id`: kebab-case, prefixed by kind like the others (`strength-…`, `mobility-…`, `climb-…`). Never reuse a removed id.
   - `name`: the English name.
   - `kind`: `WORKOUT_KINDS`; `focus`: one of `FOCI` or `null` (General).
   - `minutes` and `targetRpe` (1-10): set both, except hangboard workouts, which leave them `null` like their siblings.
   - `items`: hangboard uses `{ grip, doses }` with a grip from `BUILT_IN_GRIPS`; every other kind uses `{ exercise: "<id>", doses }`.
   - Every exercise an item names must be a built-in exercise; add it first when it is new.
     Plain interval steps (`{ step: "hard" }` / `"easy"`) are the only exception.
   - `Dose`: `sets` always; `reps`, `onS`, `offS`, `setRestS` (seconds) as the prescription needs.
     Hangboard built-ins never carry `edgeMm` or `weightKg`; the user picks those per use.
     Two doses on one item make it alternate (A/B weeks).
2. Add `workouts.builtIn.<id>.name` and `.blurb` to all four catalogs, next to the other `workouts.builtIn.*` keys; `en`'s name is the same as core's.
   The blurb is one sentence in the existing voice: what it trains and why a climber does it.

## Copy

- American English in `en`; natural, idiomatic de/fr/es that matches the neighbouring entries' register, not word-for-word.
- Names are short and in natural case; the UI uppercases where it wants to.
- Same placeholders in every locale (the parity test in `i18n.test.ts` fails otherwise).
- No board brand names.

## Visual editor

Will can also edit the library in the editor artifact: https://claude.ai/artifact/XrMUxjdh3vRjEkygfHj7LR (source `editor.html` here; republish with the Artifact tool, `url` set to that link).
Its database holds one document per built-in in collection `entries`, id `ex-<id>` or `wo-<id>`, with `status` `built` or `pending`.
Workout items name their exercise in `ref`: a built-in exercise id, `grip:<id>`, or `step:hard` / `step:easy`.
An edited built-in keeps the code's version in `orig`, a new one has `isNew: true`, and `note` is free text for you.

- `/library-add apply`: query `entries` where `status == "pending"` with the ArtifactData tool, apply each one to the code by the rules above (new entries get new keys; edits change the existing spec and its English name in core and `en`, and re-translate de/fr/es when the English changed), run the checks, then batch `update` each applied document to `status: "built"`, removing `orig`, `isNew` and `note` (pin each write with `if_version`).
  An ID must never change on a built-in; if a pending edit asks for something the rules forbid, leave it pending and say why.
- `/library-add sync`: after the library changed in code, run `node .claude/skills/library-add/export.mjs <dir>` from the repo root; it writes one JSON file per built-in into `<dir>`.
  Batch `set` them into `entries` (at most 50 writes per batch), skipping documents that are `pending`, and delete documents for built-ins that no longer exist.

## Check

```sh
rtk err pnpm check-types
rtk test pnpm --filter @sendtally/core --filter @sendtally/features test
pnpm format
```

Then report a short table of what was added (id, kind, measure or focus, doses) and any value you defaulted.
