# sendtally infrastructure

Terraform owns the account-level Cloudflare resources for sendtally in the
**Chalk and Circuits** account (`f3514650e9f74f7fe7db71fdd6577a8f`):

- the `sendtally.com` zone and its TLS/HTTPS settings
- DNS records that are not Worker hostnames (Clerk, mail, verification)
- D1 databases (`sendtally-staging`, `sendtally-production`)

Wrangler still owns what it deploys: the Worker scripts, their bindings, Worker secrets, and the Worker custom domains
(`sendtally.com`, `api.sendtally.com`, `staging.*`, `api-staging.*`). Those are
created on `wrangler deploy` and need the script to exist first, so they stay in
`wrangler.jsonc`. Terraform outputs the D1 ids that `wrangler.jsonc` pins.

## Setup

```sh
brew install hashicorp/tap/terraform     # >= 1.9
cd infra/terraform
terraform init
cp terraform.tfvars.example terraform.tfvars
export TF_VAR_cloudflare_api_token=...   # from 1Password, vault "Send Tally"
export TF_VAR_smoke_check_token="$(doppler secrets get SMOKE_CHECK_TOKEN --plain --project sendtally --config prd)"
terraform plan
```

State is local and gitignored. There is one operator; if that changes, move
state to an R2 bucket with the `s3` backend before a second person runs
`apply`.

### API token

Create at dash.cloudflare.com/profile/api-tokens ("Create Custom Token"):

| Scope   | Permission           | Level |
| ------- | -------------------- | ----- |
| Account | Account Settings     | Read  |
| Account | Workers Scripts      | Edit  |
| Account | D1                   | Edit  |
| Account | Queues               | Edit  |
| Zone    | Zone                 | Edit  |
| Zone    | Zone Settings        | Edit  |
| Zone    | DNS                  | Edit  |
| Zone    | SSL and Certificates | Edit  |
| Zone    | Workers Routes       | Edit  |

Account resources: **Chalk and Circuits** only. Zone resources: all zones in
that account. Store it in 1Password; never in tfvars or the repo.

## Day-to-day

- New DNS record: add to `dns_records` in `terraform.tfvars`, `terraform apply`.
- New D1 environment: extend `local.environments` in `d1.tf`, apply,
  then paste the id from `terraform output d1_database_ids` into `wrangler.jsonc`.
- D1 schema changes stay in Drizzle + `wrangler d1 migrations apply`; Terraform
  never touches table contents.
- `prevent_destroy` is on for D1. Removing an environment needs a deliberate
  two-step (drop the lifecycle block, apply).

## The deploy smoke check and bot protection

`.github/scripts/smoke.sh` runs from a GitHub Actions runner, so its requests
arrive from an Azure datacenter range and Cloudflare challenges them: the site
answers 403 with the "Just a moment..." interstitial and the deploy goes red
while the Worker is serving fine.

The skip rule in `waf.tf` lets requests carrying `x-sendtally-smoke:
$SMOKE_CHECK_TOKEN` past the security products that run on the Ruleset Engine.
The token lives in Doppler (`SMOKE_CHECK_TOKEN`, both configs) and as the
`SMOKE_CHECK_TOKEN` repo secret in GitHub; rotating it means changing it in
both places and re-applying.

**Bot Fight Mode is the one thing this cannot cover.** It is evaluated outside
the Ruleset Engine, so no skip rule, page rule, or IP access rule reaches it.
If the smoke check still gets challenged after this rule is live - the failure
output prints `cf-mitigated` and `cf-ray` so you can tell - then Bot Fight Mode
is the source, and the only fixes are turning it off under Security → Bots or
moving to Super Bot Fight Mode, which does honour skip rules.

The migration from the personal account is documented in
`docs/cloudflare-account-migration.md`.
