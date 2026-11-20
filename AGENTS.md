# sendtally - Agent Guidelines

## Project Overview

sendtally is a multi-user climbing log: users record each climbing session (climbs, grades, sends and attempts, location) in the app, every session is scored for effort on an RPE-style 1-10 scale, and sessions can optionally be posted to Strava as `RockClimbing` activities with an effort-based title and per-climb log.

**The only source of session data is the log-session form the user fills in.** There is no automatic import from any third party.

### Aurora Climbing integration is discontinued (September 2026)

sendtally originally pulled ascents and attempts from Aurora Climbing board apps (Tension, Kilter, Aurora, Decoy, Grasshopper, So iLL, Touchstone) through their private API.
Aurora asked Will to stop, because using their API this way is against their terms of service. That request is honoured unconditionally:

- Never call any Aurora-hosted API, from the Worker, the apps, tests, scripts, or the Go CLI. Do not add new code paths that do, and do not "fix" or revive existing ones.
- The board connect flow, the cron/queue sync pipeline, the per-board climb cache, and the `board` session source are legacy. They are being removed; until they are gone, treat them as dead code that must not run in production.
- Existing `board`-sourced session rows in D1 stay as read-only history for the users who have them. They are never refreshed, and never edited. Their owner can still delete them.
- Do not describe the product as syncing from boards anywhere (marketing copy, store listings, app strings, docs).
- Manual entry (`source = "manual"`) is the product. Any future integration must be an officially sanctioned one, agreed with the provider first, and is a decision for Will.

The product is free for users; the monetization path is ad revenue (SEO content pages on the web app first, mobile ads later) plus the paid long-term insights tier.
The core user value is the effort/RPE trend history - "Strava for climbing effort".

Current scope: sign up, log sessions via the form, session list and detail, trends, optional Strava posting. Journal entries and project tracking are next.

## Two implementations live in this repo

1. **The hosted service** (target architecture below): TypeScript monorepo, Cloudflare-hosted, Expo mobile apps. This is the product.
2. **The Go CLI** (`tools/cli-go/`): the original single-user macOS tool, now historical. Its `session`, `effort`, and `grades` packages remain the acceptance spec for the TypeScript port (same fixtures, same expected RPEs). Its `aurora` package must not be run or extended (see above). Do not grow the CLI.

---

## Architecture decisions (settled - do not relitigate without Will)

| Decision         | Choice                                                                                                                                                                                                        | Why                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product shape    | Multi-user SaaS                                                                                                                                                                                               | Domain, auth, and mobile apps only make sense multi-user                                                                                                   |
| Serving language | TypeScript port of the Go engine                                                                                                                                                                              | Workers-native; the pure logic is ~800 lines and becomes shareable across service, web, and mobile                                                         |
| Hosting          | Cloudflare for everything possible                                                                                                                                                                            | Workers, D1, custom domains, DNS                                                                                                                           |
| Session source   | Manual entry only: the log-session form (`POST /v1/sessions`, `PUT /v1/sessions/:fingerprint`). No cron, no queue, no third-party polling                                                                     | Aurora integration discontinued at Aurora's request (see Project Overview). Remove the cron/queue pipeline rather than repurpose it                        |
| Credentials      | Never store passwords. The only stored third-party credential is the Strava token pair, AES-GCM encrypted at rest (key in Worker secret, ciphertext in D1)                                                    | Legacy board tokens in D1 are dead and get deleted with the board tables. "We never store your password" must stay true                                    |
| Database         | Single shared D1 database, `user_id` keys everywhere. No per-user databases                                                                                                                                   | Tiny per-user data; cross-user queries needed; one migration stream                                                                                        |
| Climb cache      | Removed. The per-board climb name/grade cache and its cursors are legacy tables scheduled for deletion                                                                                                        | Board data came from Aurora's API, which we no longer call. Manual climbs carry their own name and grade                                                   |
| Derived data     | Computed effort results (RPE, title, summary, top grades) are persisted in D1 per session at write time                                                                                                       | App reads (session list, trends) never recompute. Scoring history is the user's own prior sessions                                                         |
| Auth             | Clerk, headless mode (their hooks, our components), email one-time codes (magic links dropped: Clerk production defaults to codes, and links break when opened in a different browser client)                 | First-class Expo SDK; Workers-side JWT verification via `@clerk/backend`. The Clerk user ID (`sub`) is the user key in D1 - no parallel identity table     |
| Web framework    | React Router 7 (framework mode) on Cloudflare Workers, one app for marketing + dashboard                                                                                                                      | The path Cloudflare paves; SSR for SEO. Next-on-OpenNext adapter tax rejected; Expo web rejected for SEO                                                   |
| Mobile           | Expo (iOS + Android only, no Expo web), EAS builds                                                                                                                                                            |                                                                                                                                                            |
| Mobile shipping  | EAS Update on the `production` channel is the default path; `runtimeVersion` is the fingerprint, so CI publishes an update when a production build already carries that hash and builds only when it does not | Store builds are the scarce resource, so the fingerprint answers "can this ship over the air?" before anything is spent. Runbook: `docs/mobile-release.md` |
| API layer        | Hono on Workers with `hono/client` RPC, Zod validation at the edges                                                                                                                                           | End-to-end types into Expo and web with no codegen. fetch handler plus Strava webhook in one Worker: the whole backend is one deployable                   |
| Design system    | Shared tokens, platform-native components. No universal component library (no Tamagui/gluestack)                                                                                                              | See Design system section                                                                                                                                  |
| Theming          | Single theme. No light/dark mode                                                                                                                                                                              | Ignore dark-mode machinery entirely                                                                                                                        |
| Notifications    | Expo push only for v1. Reconnect prompts always on; sync-result pushes off by default                                                                                                                         | Every user has the app; Clerk owns the only email we send (magic links)                                                                                    |
| Strava deauth    | Subscribe to Strava's deauthorization webhook from day one                                                                                                                                                    | Mark connections dead immediately instead of via failed posts                                                                                              |
| Pricing          | Free. Ad revenue path (web content pages first)                                                                                                                                                               | Keep infra on free tiers; SEO web content is the ad surface                                                                                                |
| Mobile billing   | RevenueCat (`react-native-purchases`) for store subscriptions; Clerk Billing stays for web. The Worker's `GET /v1/entitlements` unions both, mirrored from a RevenueCat webhook into D1                       | Receipt validation and the subscription lifecycle are RevenueCat's problem, not a Worker we maintain; every client asks one question                       |

## Monorepo structure (target)

- **Package manager:** `pnpm`. Never `npm` or `yarn`.
- **Build system:** Turborepo. Tasks run from the repo root: `pnpm dev`, `pnpm build`, `pnpm check-types`, `pnpm test`, `pnpm format`.
  `pnpm lint` is ESLint, run once at the root rather than per package; the flat config is `eslint.config.js`.
  Agents running checks wrap them in RTK (`rtk err pnpm check-types`, `rtk test pnpm test`): its hook does not rewrite pnpm scripts, and the filters keep only errors and failing tests, with the full output recoverable through `rtk recall`.
- **Toolchain versions:** pinned in `.prototools` (proto manages Node and Go here; this repo does not use asdf).
- **Local iOS builds** additionally need Xcode, CocoaPods, and Homebrew `gmp`, which the rbenv ruby CocoaPods runs under links against; a missing `libgmp.10.dylib` kills every `pod` call.
- **Package scope:** every workspace package is `@sendtally/*` (e.g. `@sendtally/core`, `@sendtally/api`). Never introduce another scope.
- **`@sendtally/api-client` depends on `@sendtally/api`** for `AppType`, so the dependency arrow runs client -> server and nothing in `api` may import `api-client` or `features` (that closes a cycle turbo rejects).
  The import is type-only and erases at build time - no Worker code reaches the app bundles - but it does put the Worker's source in the apps' type programs, so `bindings.ts` carries a `/// <reference types="@cloudflare/workers-types" />` for them.
  The cost is that a Workers-only global such as `D1Database` or `HTMLRewriter` typechecks inside `apps/web` and `apps/mobile`; it still fails at runtime there, so treat a Worker API appearing in app code as a mistake the compiler will not catch for you.

### Domain and routing

Domain: `sendtally.com`, purchased and DNS-hosted on Cloudflare.
The product was briefly named boardsync; that name was dropped because `boardsync.com` is held by an unrelated party and `boardsync.app` is registry-premium and not sellable via Cloudflare Registrar.
`sendtally.app` is worth registering too as a redirect if it is standard-priced.

- `sendtally.com`: `apps/web` (Workers custom domain)
- `api.sendtally.com`: `packages/api` Worker

### Environments and deploys

- **The Cloudflare account is pinned as `account_id` in both `wrangler.jsonc` files** (`f3514650...`, the "Chalk and Circuits" account that owns the `sendtally.com` zone and everything else). The login also sees the older personal account (`7b398a51...`) that sendtally was migrated out of in September 2026; without the pin wrangler can resolve to it - deploys and `secret bulk` then silently land on a shadow Worker in an account with no zone and no D1, while `tail` watches nothing and the live site never changes. Never remove the pin.
- Account-level resources (zone, DNS, D1) are Terraform-managed in `infra/terraform/`; never create them in the dashboard.
- `main` is the only long-lived branch and is production. All work branches off `main` and PRs target `main`; merging a PR triggers the production deploy and D1 migrations. There is no `staging` branch: the staging environment is the pull request preview sandbox, described below.
- D1 migrations: `wrangler d1 migrations apply`, additive and forward-only. Never delete or rewrite prior migrations.
- Schema source of truth is Drizzle (`packages/api/src/db/schema.ts`).
  Change the schema there, then run `pnpm --filter @sendtally/api db:generate` to emit the next migration into `migrations/` (drizzle-kit diffs against `migrations/meta/`; `0005_drizzle_baseline.sql` anchors the pre-Drizzle history).
  Wrangler remains the applier - CI applies migrations on every deploy, and PR CI validates them against a fresh local D1.
  Never hand-write migration SQL for schema changes; never edit `migrations/meta/` by hand.
- Database access goes through the typed Drizzle queries in `packages/api/src/lib/repo.ts` - no raw SQL strings in Worker code.
- Nothing in the Workers Builds Build, Version, or Deploy fields may run a real `wrangler deploy` for another Worker.
- Wrangler environments, Terraform, CI deploys, and pull request previews (Workers Builds, staging sandbox, preview URLs): load the `deploys-and-secrets` skill before touching or debugging any of them.

### Secrets

- Source of truth is the Doppler project `sendtally` (configs `stg` and `prd`). Push with `infra/scripts/push-secrets.sh <production|staging>`, and add a new secret to its per-Worker allowlist as well as to Doppler or it is silently skipped. Never paste secret values into files, commits, or chat.
- Both Workers need secrets: without `CLERK_SECRET_KEY` the `apps/web` Worker 500s on every route while the deploy reports success. The per-Worker lists, staging gaps, error 10215, and where each value comes from are in the `deploys-and-secrets` skill.

## Session flow (hosted)

1. The user submits the log-session form (name, date, start/end time, location, climbs with grade, send/attempt, tries, optional RPE). Zod validates the body (`manualSessionBody`).
2. The Worker assigns `fingerprint = manual-<uuid>` and builds the session with `buildManualSession`, scoring it against the user's other sessions with `@sendtally/core` to produce RPE, title, and summary.
3. The row is written to `sessions` with `source = "manual"` and the climbs stored in `climbs_json`.
4. If Strava posting is on, the session posts after the response via `waitUntil`: create the activity and record `strava_activity_id` immediately. Effort goes in the description's first line ("RPE 7/10"): Strava's API accepts perceived exertion but silently drops it, so there is no second patch call. Posting is gated on `posting_enabled` and `post_since`; an explicit request from the session page (`POST /v1/sessions/:fingerprint/strava`) bypasses both gates. Failures land in `post_state` / `post_error` and are retried from the session screen - there is no background retry.

Invariants:

- Session identity is the fingerprint; edits keep it, so a Strava activity is never posted twice for one session.
- Dedup lives in the database (`strava_activity_id` / `posted_at` checked before posting, set after). Retries are always safe.
- Strava rate limiting is a clean pause, not an error.
- Unknown grades are `-1` and score conservatively as V1.
- Grades carry their scale: `v` and `font` are boulders, `yds` and `french` are routes.
  Route grades map to a shared route ladder plus a V-equivalent (both tables in `packages/core/src/grades.ts`), and the effort engine scores every climb through that V-equivalent.
  Display never converts across disciplines, but within one it follows the climber's grade scale preference (`gradeScales`: V or Font, YDS or French).
  Every grade a user reads, in a label, chart, picker, accessibility label or assistant tool, goes through `displayGrade`, `sessionGradeLabel`, `climbGradeLabel` or `gradeFormatter` in `packages/features/src/sessions/grades.ts`, or `draftGradeLabel` for a climb in a form; the apps read the scales from `useDisplayScales()` (a provider at each app root) or, inside a feature hook, `useGradeScalePrefs(api)`.
  A grade is stored in the scale it was logged in and converted at display time, never rewritten: the persisted `top_grade_label` / `top_send_grade_label` columns, and a climb in the edit form, which changes scale only when the user picks a grade again (`withPickedGrade`).
  Pickers offer the user's scale; only the gym editor shows a gym's own scale, because that is what it edits.
  The CSV export and the Strava description keep the scale logged.
  A mixed session reports stats for its dominant discipline.
- Keep the "created by https://sendtally.com" attribution line in activity descriptions (Strava attribution expectations).
- Legacy `source = "board"` rows are read-only history: never re-scored, never re-posted, never edited.
  Their owner can delete them, though, same as any other session.
  Deleting a row you own calls nothing upstream and re-scores nothing, so the read-only rule does not reach it - the rule exists to stop us refreshing from an API we no longer call, not to hold a user's own history hostage.
  Tags on board rows work for the same reason.

## Strava operational constraints

- New Strava API apps are capped at one connected athlete until Strava approves a quota increase. Build order: the service runs single-athlete (Will) first; multi-user launch is gated on Strava approval, which requires a working branded app.
- Handle rate limiting per the invariant above; Strava limits are per-app, so backoff is global, not per-user.
- The deauthorization webhook endpoint lives on the API Worker.

## Design system

Three layers; the tokens file is the contract between platforms.

1. `@sendtally/design`: CSS-variable tokens (`styles.css` + `tokens/`) and a typed React component library (Logo, Button, Badge, Label, Card, StatStrip, GradeBars), both synced from the "Sendtally Design System" project on claude.ai/design via the DesignSync tool. That project is the design source of truth - read its `readme.md` (voice, contrast rules, iconography, layout) before designing anything new. Note: its internal copy still says "boardsync"; the code here is renamed to sendtally.
2. Web: consumes `@sendtally/design` components directly (inline styles driven by the tokens - no Tailwind, no shadcn; the design system ships its own components). Clerk headless hooks get skinned with these.
3. Native: React Native `style` props driven by the TypeScript tokens in `@sendtally/design/tokens` (`colors`, `radius`, `fonts`), with a small hand-rolled kit in `apps/mobile/components` (sheet, chip, segmented control, select row, keypad, ...). No NativeWind and no pre-built RN component library.

A token must mean the same colour on both platforms: `tokens.ts` and the CSS variables carry the same values.

Red (watermelon) is only for destructive actions, and those use the `danger` red outline Button.
A call to action that is not destructive (Become a member, Create account, Save) uses the blue `azure` Button, never a red fill.

Mobile form standard: a focused input always stays visible when the keyboard comes up.
Wrap the screen's scroll view in `KeyboardAvoidingView` (`behavior="padding"` on iOS) and give the scroll view `keyboardShouldPersistTaps="handled"`; `GymEditor` and `EntryComposer` are the reference.
Design work (Claude-generated or otherwise) targets the token vocabulary; each platform implements idiomatically.

### Screen design rules

These came out of Will's review of the workout screens on 2026-11-19 and apply to every screen on both apps.
A design or a build that breaks one is not ready for review.

- **One job per screen.**
  Write the screen's job as one sentence before designing it, and cut or move behind a button whatever does not serve it.
  A workout's page says what the workout is and starts it; a live run does the current set; a finished workout shows what was done.
- **History opens from a History button.**
  Past sessions and trend charts never sit inline on a detail, run or finished screen.
  A workout has one history view and an exercise has one, and every screen that shows that workout or exercise opens the same view from a History button.
- **Show this session, resolved.**
  A workout that alternates or progresses shows only the sets, reps and load of the session about to be done.
  Never show the rule that produced them ("Alternates: A is 5 x 2"), the other variant, or the next session.
- **A number carries its metric and its scale.**
  "Target RPE 8/10" and "RPE 7", never "Target effort" or "effort · aimed 8".
  One concept has one word in the plan, the run, the review and the finished workout.
- **Type weight follows importance.**
  In any row the name is the strongest text, the values come second, and a position (A1, set 3, round 2) is the quietest.
  A name gets its own line when the row also holds inputs.
- **What the user is aiming for gets the emphasis.**
  The session's target (Target RPE, the sets and reps) sits in the hero, in the head of the exercise block above its rows, or directly beside the input, never in a muted line.
- **Rows of one kind share one column grid.**
  Every set row on a screen takes its columns from one definition (`SET_COLUMNS` on mobile), so inputs, ticks and trailing controls line up down the screen across cards and workout kinds.
- **Say it once.**
  No line that restates what the order or the layout already shows ("Next: Calf raises"), no tile that counts what is listed below ("16 sets"), no usage counter ("Used once").
- **Selection is explicit and reversible.**
  Pressing a row outside its inputs and its tick selects it, and pressing it again or anywhere else unselects it; typing in a field or ticking a set does not select.
  Remove and other secondary row actions show only on the selected row, where Remove takes the place of the row's number or position and nothing else moves.
  The row's primary control (the tick) holds the trailing edge in every state.
- **One press moves between inputs.**
  With the keypad open, pressing another field moves the keypad to that field.
- **A log is not graded.**
  A set that differs from its target is recorded as done, in neutral ink, with no warning colour and no "2 of 5 reps" line.
  Amber and red are for a status that needs the user (a missed day, a failed post), for what blocks a save, and for destructive actions.
- **The same thing looks the same everywhere.**
  An exercise has one row anatomy in the workout page, the run, the review and the finished workout, and one component per platform draws it for every workout kind.
  A kind adds fields to the shared row; it does not get a row component of its own.

The Workout states artifact (https://claude.ai/artifact/J8ec8noddsaU7kXUz33z1H) draws every workout screen under these rules, for each workout kind, as it was and as approved on 2026-11-19.
Check a change to a workout screen against it, for every kind, before building.

## Migration order

5. **Aurora removal (in progress):** delete the board connect flow, cron + queue pipeline, Aurora client, catalogue cron, and the `board_*` tables; drop board-sync copy from the apps and web. Keep `source = "board"` rows readable.
6. Journal entries (free-text, attachable to a session).
7. Apply for the Strava quota increase; open sign-ups on approval.

---

## Analytics

PostHog is the product analytics tool; Google Analytics only covers marketing-page traffic and mobile install attribution.
Load the `analytics` skill before adding, renaming, or removing an event, an identify call, or a tracking SDK.
The logbook itself never goes to PostHog - event properties stay counts and enum-ish strings.
Anything added here has to be reflected in `apps/web/app/routes/privacy.tsx`.

## Copy

Rules for anything a user reads: app strings, store listings, marketing pages, docs.

- **Say "climbing", not "board climbing".** The product is a climbing log. Board climbing is one thing people use it for, not the category. "A session log for climbers", never "a session log for board climbers".
- Do not describe the product as syncing from boards, or from any third party. The log-session form is the only source of session data.
- Board brand names (Kilter, Tension, Moonboard) are fine in store **keywords**, where they serve discovery. Keep them out of visible prose and out of sample data in screenshots.
- Sample session names in placeholders and mockups should read like something anyone would type: "Tuesday night session", not "Tuesday board night".
- The exception is legacy UI that labels a `source = "board"` session. Those rows really did come from a board, and `BOARD_LABELS` naming them is accurate history, not positioning.

Store listing copy lives in `apps/mobile/store/listing.md` and should match what is actually live in the console.

---

## Coding conventions

### TypeScript

- `strict: true` at the root tsconfig. Do not relax it.
- No `any`. Use `unknown` and narrow.
- Explicit return types on all exported functions and React components.
- Prefer `type` over `interface` unless declaration merging is needed.
- Zod at every I/O boundary (API input, external API responses, queue messages).

### Localization

- Every user-facing string goes through `t()` from `@sendtally/features/i18n`; never hardcode English in a component, transform, or `meta()`.
  Catalogs are typed TS modules per locale and namespace under `packages/features/src/i18n/locales/<locale>/`, spread into that locale's `index.ts`; keys are `namespace.name` where the namespace is the feature (`sessions`, `projects`, `auth`, ...) or `common` for words shared across features, never the platform: one string has one key, and web and mobile share it. Plural forms are `name_one` / `name_other` picked when `count` is passed (a hand-rolled rule: iOS Hermes has no `Intl.PluralRules`, so never reach for it).
  Proper nouns and symbols no translator would change ("Strava", "RPE", "V", "YDS", "Google Play", "{n}/10") are literals in code, not catalog keys.
  A key must exist in all four catalogs (`en`, `de`, `fr`, `es`) with the same placeholders or the parity test in `i18n.test.ts` fails.
- Dates and numbers go through `formatDate` / `formatNumber` (locale-aware `Intl`); labels are stored and passed around in natural case, and the component or text style that renders a label uppercases it (`textTransform: "uppercase"`) - never the caller, never a transform.
- Never call `t()` at module scope: the locale is set after modules load on mobile and per request on the web Worker (`AsyncLocalStorage` in `entry.server.tsx`), so a module-level constant freezes to English. Keep module-level data as plain values or keys and resolve the text in a function (`trendRangeLabel(range)`, `memberBenefits()`).
- Locale is the device language on mobile (`expo-localization`) and `Accept-Language` on the web; the marketing landing is additionally served per locale at `/de`, `/fr`, `/es` from `apps/web/app/landing/copy.<locale>.ts` with hreflang alternates.
  Terms, privacy, support, API error bodies, and the Strava activity description stay English.
- Moderation tooling (`/app/moderation`, `apps/web/app/moderation/`, `packages/features/src/areas/moderation.ts`) is internal and English only: plain string literals, no `t()`, no catalog keys.
  It is also never indexed or crawled - the route sets `noindex` and `robots.txt` disallows `/app/`.
- Grades follow the user's grade scales everywhere; the rule and its functions are under Session flow, Invariants.
- Weights follow the user's weight unit everywhere.
  Values are stored in kilograms; the unit comes from `useWeightUnit(api)`, which is null until it loads, or the ready hang model (`model.settings.units`), and a screen that shows or takes a weight waits for it (`WithWeightUnit` on mobile) rather than guess.
  Every weight a user reads goes through `packages/features/src/hang/weights.ts`: `weightText` ("100 kg"), `hangLoadText` / `hangLoadValue` (added load, "+10 lb", "BW"), `loadLabel` (either, by kind) and `loadChange` ("+2.5 lb", "Same").
  Inputs convert with `toUnit` / `fromUnit` and step with `bumpLoad`, `loadStep` and `stepOnGrid` in `packages/core/src/hang/loads.ts`, so a typed value reads back as typed and a step lands on the step grid.
  A default or a sample weight is authored per unit (`defaultPullKg`), never converted from a kilogram literal.
- ESLint enforces both (the grades-and-weights block in `eslint.config.js`): no `"kg"` / `"lb"` literal (the list is `WEIGHT_UNITS`), no `formatGrade` import and no hand-built `` `V${...}` `` outside the formatter modules.
  The Log render test on each app sets kg and Font and asserts no "lb" or V grade; keep it passing when a screen changes.

### Code organization

- Features live in colocated directories: everything a feature needs (components, hooks, transforms, tests) sits together in one directory named for the feature.
- Types exported for reuse go in a `types.ts` next to the file that uses them - not in a distant shared types module, and not inline in a component file when other files import them.
- One component per file, named after the file.
- Components generic to a feature (used by several of its screens/sections but nowhere else) live in a `components/` directory inside that feature.
- When a component is used across many features, move it up to the highest relevant directory - the app-level `components/`, or `@sendtally/design` if it belongs to the design system.
- Tests co-located as `<Component>.test.tsx` / `<module>.test.ts`.

### Formatting

Prettier owns formatting; config at `.prettierrc` in the repo root.
ESLint owns everything a type error would not catch; nothing in `eslint.config.js` is stylistic.
Run `pnpm format` before committing.
Avoid comments in code; make code short, composable, and obviously named.

### Go CLI (`tools/cli-go/`)

- Standard `gofmt` / `go vet`. Pure stdlib style.
- `go test ./...` from `tools/cli-go/`; single test: `go test ./effort -run TestName`.
- Changes here are maintenance-only; new product work happens in TypeScript.

---

## Git

- Conventional Commits: `feat|fix|refactor|style|test|chore|docs|perf(scope): description`.
  CI enforces this with commitlint on every commit in a pull request and on the pull request title, since a squash merge lands the title instead.
  The mobile release derives its semantic version from these subjects, so an unconventional commit silently downgrades a release to a patch bump.
  Config lives under the `commitlint` key in the root `package.json`.
  `subject-case` and the body and footer line-length rules are off: proper nouns start real subjects here, and bodies carry prose and session URLs past 100 characters.
  Headers may run to 180 characters (`header-max-length`): a subject that says what changed in plain words often passes 100.
- Branch naming: `feat|chore|bug|refactor/<feature-name>` off `main`. No agent names or AI metadata in branch names.
- No AI co-author trailers in commit messages.
- PR descriptions: short clear paragraphs, bullet lists for completed tasks, `Closes #123` where an issue exists.

### Worktrees

Use **worktrunk** (`wt`) for all worktree creation and lifecycle (`wt switch --create` / `wt merge` / `wt remove`).
Project configuration lives in `.config/wt.toml`; personal settings belong in `~/.config/worktrunk/config.toml`.
Never hand-roll `git worktree add`.

A new worktree gets the gitignored local secrets and an install from the `pre-start` hook, which blocks before any dev server starts.
`.worktreeinclude` at the repo root is the allowlist of files that travel - currently `.env` and the two `.dev.vars`.
It is an allowlist rather than "copy everything ignored" because the latter also duplicates build output and caches such as `node_modules` and `infra/terraform/.terraform`.
Add a file there when a new gitignored thing turns out to be needed per worktree; without the Clerk keys the web app starts in keyless mode and every signed-in request fails a JWKS key-id check against a throwaway instance.

`post-remove` kills the dev servers a removed worktree left behind (`infra/scripts/kill-worktree-servers.sh`).
Without it an orphaned wrangler or vite keeps port 8787 or 5173, and the next worktree to run `pnpm dev` fails to bind for reasons that point nowhere.

The hooks need a one-time approval per machine, which `wt` prompts for on first use.
Run `wt config approvals add` and review what it lists - an agent must never approve them for you.

---

## Security notes

- No third-party passwords ever transit the Worker. Strava is connected via OAuth only.
- Strava access/refresh tokens are AES-GCM encrypted in D1; the key lives in a Worker secret.
- Account deletion must revoke the Strava token, delete all D1 rows for the user, and delete the Clerk user.
  The one exception is approved Areas contributions (areas, climbs and approved revisions), which stay with the author removed (`created_by` / `submitted_by` / `reviewed_by` set to null) because other users' sessions link to them; `repo.deleteUserData` does both in one batch.
