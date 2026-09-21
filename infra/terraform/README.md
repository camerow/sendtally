# sendtally infrastructure

Terraform owns the account-level Cloudflare resources for sendtally in the
**Chalk and Circuits** account (`f3514650e9f74f7fe7db71fdd6577a8f`):

- the `sendtally.com` zone and its TLS/HTTPS settings
- DNS records that are not Worker hostnames (Clerk, mail, verification)
- the redirect rule that sends `www.sendtally.com` to the apex
- D1 databases (`sendtally-staging`, `sendtally-production`)

`www` is a proxied CNAME, so Cloudflare answers for it but has no origin behind
it - the Worker custom domain covers the apex only. Without the redirect rule in
`redirects.tf` every request to `www.sendtally.com` returns a 522. Changing that
rule needs `terraform apply`; merging alone will not move it.

Wrangler still owns what it deploys: the Worker scripts, their bindings, Worker secrets, and the Worker custom domains
(`sendtally.com`, `api.sendtally.com`, `staging.*`, `api-staging.*`). Those are
created on `wrangler deploy` and need the script to exist first, so they stay in
`wrangler.jsonc`. Terraform outputs the D1 ids that `wrangler.jsonc` pins.

## Setup

```sh
brew install hashicorp/tap/terraform     # >= 1.9
cd infra/terraform
export TF_VAR_CLOUDFLARE_API_TOKEN=...
export AWS_ACCESS_KEY_ID=...             # R2 API token
export AWS_SECRET_ACCESS_KEY=...
terraform init
terraform plan
```

State lives in the R2 bucket `sendtally-tfstate` (`versions.tf`), reached
through R2's S3-compatible API, so it survives the loss of any one machine and
a second operator can run `apply`. The bucket is created by hand, since state
cannot live in a bucket this config creates:

```sh
CLOUDFLARE_ACCOUNT_ID=f3514650e9f74f7fe7db71fdd6577a8f \
  npx wrangler r2 bucket create sendtally-tfstate
```

The `AWS_*` variables are an R2 API token ("Object Read & Write" on that
bucket), created at dash.cloudflare.com under R2 > API. Terraform's `s3`
backend reads those names; nothing here talks to AWS.

There is no `terraform.tfvars` to copy. DNS records live in the committed
`dns_records.auto.tfvars`, which Terraform loads automatically - every value in
it is public, since a DNS lookup returns all of it. The API token is the one
secret and stays in the environment.

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
| Zone    | Dynamic Redirect     | Edit  |

Account resources: **Chalk and Circuits** only. Zone resources: all zones in
that account. Never put it in a tfvars file or the repo.

Dynamic Redirect is what lets Terraform manage `redirects.tf`. A token without it
plans the ruleset happily and then fails the apply with a bare
`403 Authentication error` on `POST /zones/<id>/rulesets`.

## Day-to-day

- New DNS record: add to `dns_records.auto.tfvars`, open a pull request, `terraform apply` once it merges.
- New D1 environment: extend `local.environments` in `d1.tf`, apply,
  then paste the id from `terraform output d1_database_ids` into `wrangler.jsonc`.
- D1 schema changes stay in Drizzle + `wrangler d1 migrations apply`; Terraform
  never touches table contents.
- `prevent_destroy` is on for D1. Removing an environment needs a deliberate
  two-step (drop the lifecycle block, apply).

The migration from the personal account is documented in
`docs/cloudflare-account-migration.md`.
