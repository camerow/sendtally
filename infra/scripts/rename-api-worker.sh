#!/usr/bin/env bash
# One-time cutover of the API Worker from sendtally-sync-service-<env> to sendtally-api-<env>.
# Usage: infra/scripts/rename-api-worker.sh <production|staging> <prepare|cutover|cleanup>
#   prepare  creates the new Worker without its custom domain and pushes its secrets (safe, repeatable)
#   cutover  deploys for real, which moves the custom domain off the old Worker (point of no return)
#   cleanup  deletes the old Worker once the domain answers from the new one
set -euo pipefail

env_name="${1:?usage: rename-api-worker.sh <production|staging> <prepare|cutover|cleanup>}"
phase="${2:?usage: rename-api-worker.sh <production|staging> <prepare|cutover|cleanup>}"
case "$env_name" in
  production) cfg=prd host=api.sendtally.com ;;
  staging) cfg=stg host=api-staging.sendtally.com ;;
  *) echo "unknown env $env_name" >&2; exit 1 ;;
esac

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root/packages/api"
old="sendtally-sync-service"
keys='["TOKEN_KEY","CLERK_SECRET_KEY","CLERK_WEBHOOK_SIGNING_SECRET","STRAVA_CLIENT_ID","STRAVA_CLIENT_SECRET","STRAVA_WEBHOOK_VERIFY_TOKEN","REVENUECAT_SECRET_API_KEY","REVENUECAT_WEBHOOK_AUTH"]'

case "$phase" in
  prepare)
    grep -v '"routes":' wrangler.jsonc > wrangler.rename.jsonc
    trap 'rm -f wrangler.rename.jsonc' EXIT
    npx wrangler deploy --env "$env_name" --config wrangler.rename.jsonc
    secrets="$(doppler secrets download --no-file --format json --project sendtally --config "$cfg" \
      | jq -c --argjson keys "$keys" 'with_entries(select(.key as $k | $keys | index($k)))')"
    npx wrangler secret bulk --env "$env_name" <<<"$secrets"
    "$root/.github/scripts/require-secrets.sh" "$env_name" $(jq -r 'keys[]' <<<"$secrets")
    echo "prepared: sendtally-api-$env_name exists with secrets; $host still points at $old-$env_name"
    ;;
  cutover)
    npx wrangler deploy --env "$env_name" 2>&1 | cat
    curl -fsS "https://$host/health"; echo
    ;;
  cleanup)
    curl -fsS "https://$host/health" >/dev/null
    npx wrangler delete "$old-$env_name"
    ;;
  *) echo "unknown phase $phase" >&2; exit 1 ;;
esac
