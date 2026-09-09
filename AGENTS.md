# sendtally - Agent Guidelines

## Project Overview

sendtally is a multi-user climbing log: users record each climbing session (climbs, grades, sends and attempts, location) in the app, every session is scored for effort on an RPE-style 1-10 scale, and sessions can optionally be posted to Strava as `RockClimbing` activities with an effort-based title and per-climb log.

**The only source of session data is the log-session form the user fills in.** There is no automatic import from any third party.

### Aurora Climbing integration is discontinued (September 2026)

sendtally originally pulled ascents and attempts from Aurora Climbing board apps (Tension, Kilter, Aurora, Decoy, Grasshopper, So iLL, Touchstone) through their private API.
Aurora asked Will to stop, because using their API this way is against their terms of service. That request is honoured unconditionally:

- Never call any Aurora-hosted API, from the Worker, the apps, tests, scripts, or the Go CLI. Do not add new code paths that do, and do not "fix" or revive existing ones.
- The board connect flow, the cron/queue sync pipeline, the per-board climb cache, and the `board` session source are legacy. They are being removed; until they are gone, treat them as dead code that must not run in production.
- Existing `board`-sourced session rows in D1 stay as read-only history for the users who have them. They are never refreshed.
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

| Decision         | Choice                                                                                                                                                                                        | Why                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product shape    | Multi-user SaaS                                                                                                                                                                               | Domain, auth, and mobile apps only make sense multi-user                                                                                               |
| Serving language | TypeScript port of the Go engine                                                                                                                                                              | Workers-native; the pure logic is ~800 lines and becomes shareable across service, web, and mobile                                                     |
| Hosting          | Cloudflare for everything possible                                                                                                                                                            | Workers, D1, custom domains, DNS                                                                                                                       |
| Session source   | Manual entry only: the log-session form (`POST /v1/sessions`, `PUT /v1/sessions/:fingerprint`). No cron, no queue, no third-party polling                                                     | Aurora integration discontinued at Aurora's request (see Project Overview). Remove the cron/queue pipeline rather than repurpose it                    |
| Credentials      | Never store passwords. The only stored third-party credential is the Strava token pair, AES-GCM encrypted at rest (key in Worker secret, ciphertext in D1)                                    | Legacy board tokens in D1 are dead and get deleted with the board tables. "We never store your password" must stay true                                |
| Database         | Single shared D1 database, `user_id` keys everywhere. No per-user databases                                                                                                                   | Tiny per-user data; cross-user queries needed; one migration stream                                                                                    |
| Climb cache      | Removed. The per-board climb name/grade cache and its cursors are legacy tables scheduled for deletion                                                                                        | Board data came from Aurora's API, which we no longer call. Manual climbs carry their own name and grade                                               |
| Derived data     | Computed effort results (RPE, title, summary, top grades) are persisted in D1 per session at write time                                                                                       | App reads (session list, trends) never recompute. Scoring history is the user's own prior sessions                                                     |
| Auth             | Clerk, headless mode (their hooks, our components), email one-time codes (magic links dropped: Clerk production defaults to codes, and links break when opened in a different browser client) | First-class Expo SDK; Workers-side JWT verification via `@clerk/backend`. The Clerk user ID (`sub`) is the user key in D1 - no parallel identity table |
| Web framework    | React Router 7 (framework mode) on Cloudflare Workers, one app for marketing + dashboard                                                                                                      | The path Cloudflare paves; SSR for SEO. Next-on-OpenNext adapter tax rejected; Expo web rejected for SEO                                               |
| Mobile           | Expo (iOS + Android only, no Expo web), EAS builds                                                                                                                                            |                                                                                                                                                        |
| API layer        | Hono on Workers with `hono/client` RPC, Zod validation at the edges                                                                                                                           | End-to-end types into Expo and web with no codegen. fetch handler plus Strava webhook in one Worker: the whole backend is one deployable               |
| Design system    | Shared tokens, platform-native components. No universal component library (no Tamagui/gluestack)                                                                                              | See Design system section                                                                                                                              |
| Theming          | Single theme. No light/dark mode                                                                                                                                                              | Ignore dark-mode machinery entirely                                                                                                                    |
| Notifications    | Expo push only for v1. Reconnect prompts always on; sync-result pushes off by default                                                                                                         | Every user has the app; Clerk owns the only email we send (magic links)                                                                                |
| Strava deauth    | Subscribe to Strava's deauthorization webhook from day one                                                                                                                                    | Mark connections dead immediately instead of via failed posts                                                                                          |
| Pricing          | Free. Ad revenue path (web content pages first)                                                                                                                                               | Keep infra on free tiers; SEO web content is the ad surface                                                                                            |
| Mobile billing   | RevenueCat (`react-native-purchases`) for store subscriptions; Clerk Billing stays for web. The Worker's `GET /v1/entitlements` unions both, mirrored from a RevenueCat webhook into D1       | Receipt validation and the subscription lifecycle are RevenueCat's problem, not a Worker we maintain; every client asks one question                   |

## Monorepo structure (target)

```
sendtally/
├── apps/
│   ├── mobile/          Expo (iOS + Android), EAS builds
│   └── web/             React Router 7 on Workers: marketing, SEO content, Strava connect, dashboard
├── packages/
│   ├── core/            ported session/effort/grades logic - pure, no I/O, no platform deps
│   ├── sync-service/    Hono Worker: API + D1 schema/migrations (cron/queue handlers are legacy, being removed)
│   ├── api-client/      typed hono/client wrapper consumed by mobile and web
│   ├── design/          design tokens (CSS variables) + React component library
│   └── ui-native/       NativeWind component kit for mobile
├── infra/
│   ├── terraform/       Cloudflare account resources (zone, DNS, D1)
│   └── scripts/         operator scripts (secret push, D1 copy)
└── tools/
    └── cli-go/          the original Go CLI (go.mod lives here)
```

- **Package manager:** `pnpm`. Never `npm` or `yarn`.
- **Build system:** Turborepo. Tasks run from the repo root: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm format`.
- **Toolchain versions:** pinned in `.prototools` (proto manages Node and Go here; this repo does not use asdf).
- **Package scope:** every workspace package is `@sendtally/*` (e.g. `@sendtally/core`, `@sendtally/sync-service`). Never introduce another scope.

### Domain and routing

Domain: `sendtally.com`, purchased and DNS-hosted on Cloudflare.
The product was briefly named boardsync; that name was dropped because `boardsync.com` is held by an unrelated party and `boardsync.app` is registry-premium and not sellable via Cloudflare Registrar.
`sendtally.app` is worth registering too as a redirect if it is standard-priced.

- `sendtally.com`: `apps/web` (Workers custom domain)
- `api.sendtally.com`: `packages/sync-service` Worker

### Environments and deploys

- Wrangler environments `staging` and `production` for `sync-service` and `web`: separate D1 databases, secrets via `wrangler secret`. There is a single Clerk instance shared by both.
- **The Cloudflare account is pinned as `account_id` in both `wrangler.jsonc` files** (`f3514650...`, the "Chalk and Circuits" account that owns the `sendtally.com` zone and everything else). The login also sees the older personal account (`7b398a51...`) that sendtally was migrated out of in September 2026; without the pin wrangler can resolve to it - deploys and `secret bulk` then silently land on a shadow Worker in an account with no zone and no D1, while `tail` watches nothing and the live site never changes. Never remove the pin.
- **Account-level resources are Terraform-managed** in `infra/terraform/` (zone, zone settings, non-Worker DNS records, D1 databases). Wrangler owns Worker scripts, bindings, secrets, and Worker custom domains. Create a D1 database in Terraform, then pin its id in `wrangler.jsonc`; never create them in the dashboard. State is local (single operator); the API token comes from 1Password via `TF_VAR_cloudflare_api_token`. Migration runbook: `docs/cloudflare-account-migration.md`.
- `main` is the only long-lived branch and is production. All work branches off `main` and PRs target `main`; merging a PR triggers the production deploy and D1 migrations. The `staging` environment still exists for manual deploys, but there is no `staging` branch in the flow.
- D1 migrations: `wrangler d1 migrations apply`, additive and forward-only. Never delete or rewrite prior migrations.
- Schema source of truth is Drizzle (`packages/sync-service/src/db/schema.ts`).
  Change the schema there, then run `pnpm --filter @sendtally/sync-service db:generate` to emit the next migration into `migrations/` (drizzle-kit diffs against `migrations/meta/`; `0005_drizzle_baseline.sql` anchors the pre-Drizzle history).
  Wrangler remains the applier - CI applies migrations on every deploy, and PR CI validates them against a fresh local D1.
  Never hand-write migration SQL for schema changes; never edit `migrations/meta/` by hand.
- Database access goes through the typed Drizzle queries in `packages/sync-service/src/lib/repo.ts` - no raw SQL strings in Worker code.
- CI: `.github/workflows/deploy.yml` runs checks (types, tests, format, Go) then deploys both Workers - push to `main` deploys production (a push to a `staging` branch, if one is ever created, deploys the staging env). Needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets. Each deploy is gated on a secret preflight, so a Worker never ships without the secrets it needs to answer a request.
  There is no post-deploy check against the live domain: Cloudflare challenges the GitHub runner's requests as datacenter traffic, so the check failed on a healthy site. Bot Fight Mode cannot be skipped by a WAF rule (it runs outside the Ruleset Engine), so this is not worth re-adding against `sendtally.com`. A Workers Builds preview URL is a hostname outside the zone's bot protection, which is where such a check belongs if we want one back.
- **Cloudflare Workers Builds also watches this repo**, connected to the `sendtally-web-production` Worker, and reports as the `Workers Builds: sendtally-web-production` check. Its build configuration has three command fields and the split matters: **Build** runs for every build, **Version** runs for non-production branches, and **Deploy** runs only for the production branch. A pull request therefore executes Build then Version - editing the Deploy command changes nothing about PR previews, which is worth remembering before debugging one.
  Both `preview:*` scripts use `versions upload`, which uploads without promoting, so GitHub Actions stays the only thing that puts code on live traffic. Never set any of these fields to `wrangler deploy` - in the Version field that publishes a PR branch straight to `sendtally.com`.
  `preview:upload` runs `preview:build` itself, so it does not depend on the Build command being right.
  The commands live in the root `package.json` rather than in the dashboard, so they are reviewable and stay in step with the app. Two things they must keep doing: build with `CLOUDFLARE_ENV=production` (without it the generated `build/server/wrangler.json` carries the base environment - name `sendtally-web`, empty `vars`, so no `API_URL` or `CLERK_PUBLISHABLE_KEY`), and run wrangler from `apps/web` (the Vite plugin writes the `.wrangler/deploy/config.json` redirect there; from the repo root wrangler finds no config and fails with "Missing entry-point to Worker script").
  A preview version runs on the production Worker, so it uses production secrets, production D1 and the live Clerk instance. Treat a preview as production data, not a sandbox.

### Secrets

- Source of truth is the **Doppler project `sendtally`** (configs `stg` and `prd`): `TOKEN_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `VITE_CLERK_PUBLISHABLE_KEY`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_AUTH`.
- Push to Workers with `infra/scripts/push-secrets.sh <production|staging>`, which runs `doppler secrets download ... | wrangler secret bulk` for both Workers. The script pushes an explicit allowlist per Worker, so a new secret must be added there as well as to Doppler or it is silently skipped. Never paste secret values into files, commits, or chat.
- **Both Workers need secrets.** For `packages/sync-service`: `TOKEN_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_AUTH`. For `apps/web`: `CLERK_SECRET_KEY` - `apps/web` renders every route through `clerkMiddleware()`, so without it the Worker throws on every request and the whole site 500s while the deploy still reports success.
- `push-secrets.sh` fails for `apps/web` with Cloudflare error 10215 ("latest version of your Worker isn't currently deployed") whenever a PR preview has been uploaded with `versions upload` since the last production deploy. The `sync-service` half still succeeds. If the web Worker needs a changed secret, merge or deploy first, then push again; otherwise the error can be ignored.
- Secrets live on the Worker, not in the config, so **a Worker deleted and recreated in the dashboard comes back with none of them**. `deploy.yml` runs `.github/scripts/require-secrets.sh` before each deploy to fail loudly instead of shipping a Worker that 500s.
- The Strava credentials originate from the maker's Strava API app; Clerk keys from the Clerk dashboard (kept in 1Password, vault "Send Tally").
- `CLERK_WEBHOOK_SIGNING_SECRET` is generated by Clerk when the webhook endpoint `POST https://api.sendtally.com/webhooks/clerk` (subscribed to `user.deleted`) is created in the dashboard; signing secrets are per endpoint. Only `prd` carries it - there is a single Clerk instance and no staging endpoint. It verifies the `user.deleted` webhook that purges D1 rows and revokes Strava when an account is deleted from Clerk's portal or dashboard rather than in-app; without it that webhook is rejected and those deletions leave orphaned data.
- `CLERK_WEBHOOK_SIGNING_SECRET` comes from the Clerk dashboard endpoint for `POST https://api.sendtally.com/webhooks/clerk` subscribed to `user.deleted`; each Clerk instance signs with its own secret, so staging and production hold different values. Without it the Worker rejects every Clerk webhook and account deletions made outside the app leave orphaned D1 rows.
- `REVENUECAT_SECRET_API_KEY` is the RevenueCat project's secret key (API keys page); the Worker uses it to read subscribers and to delete them on account deletion. `REVENUECAT_WEBHOOK_AUTH` is a random string we generate and paste into the webhook's Authorization header field in RevenueCat; the Worker rejects any `/webhooks/revenuecat` call that does not carry it. The public SDK keys (`goog_…`, later `appl_…`) are not secrets and live in `apps/mobile/eas.json`. Setup runbook: `docs/mobile-release.md`, "Billing on mobile".

## Session flow (hosted)

1. The user submits the log-session form (name, date, start/end time, location, climbs with grade, send/attempt, tries, optional RPE). Zod validates the body (`manualSessionBody`).
2. The Worker assigns `fingerprint = manual-<uuid>` and builds the session with `buildManualSession`, scoring it against the user's other sessions with `@sendtally/core` to produce RPE, title, and summary.
3. The row is written to `sessions` with `source = "manual"` and the climbs stored in `climbs_json`.
4. Strava posting for manual sessions is not wired yet (it only ever ran inside the removed Aurora pipeline). When it is added: post on create, then patch perceived exertion in a second call (the create endpoint ignores the field). `StravaClient` in `lib/strava.ts` and the `posting_enabled` / `post_since` columns on `strava_connections` are ready for it.

Invariants:

- Session identity is the fingerprint; edits keep it, so a Strava activity is never posted twice for one session.
- Dedup lives in the database (`strava_activity_id` / `posted_at` checked before posting, set after). Retries are always safe.
- Strava rate limiting is a clean pause, not an error.
- Unknown grades are `-1` and score conservatively as V1.
- Keep the "synced by sendtally" attribution line in activity descriptions (Strava attribution expectations).
- Legacy `source = "board"` rows are read-only history: never re-scored, never re-posted, never deleted by anything except account deletion.

## Strava operational constraints

- New Strava API apps are capped at one connected athlete until Strava approves a quota increase. Build order: the service runs single-athlete (Will) first; multi-user launch is gated on Strava approval, which requires a working branded app.
- Handle rate limiting per the invariant above; Strava limits are per-app, so backoff is global, not per-user.
- The deauthorization webhook endpoint lives on the sync-service Worker.

## Design system

Three layers; the tokens file is the contract between platforms.

1. `@sendtally/design`: CSS-variable tokens (`styles.css` + `tokens/`) and a typed React component library (Logo, Button, Input, Badge, Label, Card, SpecRow, StatStrip, GradeBars, ActivityCard, RpeMeter, ClimbLog), both synced from the "Sendtally Design System" project on claude.ai/design via the DesignSync tool. That project is the design source of truth - read its `readme.md` (voice, contrast rules, iconography, layout) before designing anything new. Note: its internal copy still says "boardsync"; the code here is renamed to sendtally.
2. Web: consumes `@sendtally/design` components directly (inline styles driven by the tokens - no Tailwind, no shadcn; the design system ships its own components). Clerk headless hooks get skinned with these.
3. Native: NativeWind 4 + a small hand-rolled kit in `@sendtally/ui-native` (button, card, list row, stat tile, sheet, input, ...). No pre-built RN component library.

`bg-primary` must mean the same color on both platforms.
Design work (Claude-generated or otherwise) targets the token vocabulary; each platform implements idiomatically.

## Migration order

1. ~~Restructure commit: move the Go CLI to `tools/cli-go/`, scaffold pnpm + Turborepo at the root.~~ Done.
2. ~~`@sendtally/core`: port `grades`, `session`, `effort` with table-driven Vitest tests mirroring the Go tests.~~ Done.
3. ~~`@sendtally/sync-service`: Strava client, D1 schema, manual session CRUD.~~ Done.
4. ~~`apps/web` and `apps/mobile`: sign-in, log-session form, session list and detail, trends, Strava connect.~~ Done.
5. **Aurora removal (in progress):** delete the board connect flow, cron + queue pipeline, Aurora client, catalogue cron, and the `board_*` tables; drop board-sync copy from the apps and web. Keep `source = "board"` rows readable.
6. Journal entries (free-text, attachable to a session).
7. Project tracking (climbs worked across many sessions before sending).
8. Apply for the Strava quota increase; open sign-ups on approval.

---

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

### Code organization

- Features live in colocated directories: everything a feature needs (components, hooks, transforms, tests) sits together in one directory named for the feature.
- Types exported for reuse go in a `types.ts` next to the file that uses them - not in a distant shared types module, and not inline in a component file when other files import them.
- One component per file, named after the file.
- Components generic to a feature (used by several of its screens/sections but nowhere else) live in a `components/` directory inside that feature.
- When a component is used across many features, move it up to the highest relevant directory - the app-level `components/`, or `@sendtally/design` if it belongs to the design system.
- Tests co-located as `<Component>.test.tsx` / `<module>.test.ts`.

### Formatting

Prettier owns formatting; config at `.prettierrc` in the repo root.
Run `pnpm format` before committing.
Avoid comments in code; make code short, composable, and obviously named.

### Go CLI (`tools/cli-go/`)

- Standard `gofmt` / `go vet`. Pure stdlib style.
- `go test ./...` from `tools/cli-go/`; single test: `go test ./effort -run TestName`.
- Changes here are maintenance-only; new product work happens in TypeScript.

---

## Git

- Conventional Commits: `feat|fix|refactor|style|test|chore|docs|perf(scope): description`.
- Branch naming: `feat|chore|bug|refactor/<feature-name>` off `main`. No agent names or AI metadata in branch names.
- No AI co-author trailers in commit messages.
- PR descriptions: short clear paragraphs, bullet lists for completed tasks, `Closes #123` where an issue exists.

### Worktrees

Use **workmux** for all worktree creation and lifecycle (`workmux add` / `merge` / `remove`).
Configuration lives in `.workmux.yaml` at the repo root.
Never hand-roll `git worktree add`.

---

## Security notes

- No third-party passwords ever transit the Worker. Strava is connected via OAuth only.
- Strava access/refresh tokens are AES-GCM encrypted in D1; the key lives in a Worker secret.
- Account deletion must revoke the Strava token, delete all D1 rows for the user, and delete the Clerk user.
